import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import {
  prependMiddleware,
  stripViteBase,
  type ConnectLikeHandle,
} from './learnings-static-plugin'

/**
 * Publishes the `apps/` workspace sources as a browsable, syntax-highlighted
 * source viewer under `/apps/*`.
 *
 * ## Why the odd on-disk layout
 *
 * GitHub Pages serves the built artifact as plain static files and picks the
 * `Content-Type` from the file extension. A file literally named
 * `binanceTradeStream.ts` is served as `video/mp2t`, so the browser downloads
 * it instead of rendering it. To make the natural URL
 * `/apps/<app>/src/data/binanceTradeStream.ts` render in the browser, each
 * source file is emitted as a *directory* containing an `index.html`:
 *
 * ```text
 * apps/<app>/src/data/binanceTradeStream.ts/index.html   <- highlighted view
 * apps/<app>/src/data/binanceTradeStream.ts/raw.txt      <- plain text
 * ```
 *
 * GitHub Pages then redirects the extension-less-looking path to the trailing
 * slash form and serves the `index.html`. The dev/preview middleware below
 * mirrors that exact behaviour (including the trailing-slash redirect) so
 * local and deployed URLs behave identically.
 */

const URL_PREFIX = '/apps/'
const RAW_FILE = 'raw.txt'

/** Directory listings live at `<dir>/index.html`, which collides with a source
 *  file that is itself named `index.html`. The file view moves aside. */
const INDEX_HTML_VIEW_DIR = 'index.html--source'

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.vite',
  '.turbo',
  '.cache',
])

const EXCLUDED_FILES = new Set([
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
])

/** Extensions served as-is (no source view) — the browser handles them. */
const BINARY_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.mp4',
  '.webm',
  '.pdf',
  '.zip',
])

const BINARY_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
}

/** highlight.js language hints, keyed by extension (falls back to autodetect). */
const HLJS_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.json': 'json',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'xml',
  '.svg': 'xml',
  '.xml': 'xml',
  '.md': 'markdown',
  '.py': 'python',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.h': 'cpp',
  '.hpp': 'cpp',
  '.c': 'c',
  '.sh': 'bash',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.toml': 'ini',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isBinary(filePath: string): boolean {
  return BINARY_EXT.has(path.extname(filePath).toLowerCase())
}

function isHidden(name: string): boolean {
  // Keep dotfiles like `.gitignore` visible; they are part of the lesson.
  return name === '.git'
}

function isExcluded(name: string, isDir: boolean): boolean {
  if (isHidden(name)) return true
  return isDir ? EXCLUDED_DIRS.has(name) : EXCLUDED_FILES.has(name)
}

/** Walks up from the VitePress root to find the repo's `apps/` workspace dir. */
export function findAppsRoot(viteRoot: string): string {
  let dir = path.resolve(viteRoot)
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'apps')
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate
    } catch {
      /* keep walking */
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(viteRoot, '../apps')
}

function isInside(root: string, filePath: string): boolean {
  const rel = path.relative(root, filePath)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/** True when any path segment is excluded, so `/apps/x/node_modules/y` 404s. */
function hasExcludedSegment(rel: string): boolean {
  return rel
    .split('/')
    .filter(Boolean)
    .some((seg) => EXCLUDED_DIRS.has(seg) || EXCLUDED_FILES.has(seg) || isHidden(seg))
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Joins the Vite base with an absolute-from-site-root path. */
function withBase(base: string, sitePath: string): string {
  const nb = (base || '/').replace(/\/+$/, '')
  return `${nb}${sitePath}`
}

function breadcrumb(base: string, rel: string): string {
  const segments = rel.split('/').filter(Boolean)
  const crumbs = [`<a href="${withBase(base, '/apps/')}">apps</a>`]
  let acc = ''
  segments.forEach((seg, i) => {
    acc += `${encodeURIComponent(seg)}/`
    const isLast = i === segments.length - 1
    crumbs.push(
      isLast
        ? `<span class="current">${escapeHtml(seg)}</span>`
        : `<a href="${withBase(base, `/apps/${acc}`)}">${escapeHtml(seg)}</a>`,
    )
  })
  return crumbs.join('<span class="sep">/</span>')
}

const PAGE_CSS = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fff; color: #1f2328;
  }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 24px 20px 64px; }
  header { border-bottom: 1px solid #d1d9e0; padding-bottom: 12px; margin-bottom: 16px; }
  .crumbs { font-size: 15px; word-break: break-all; }
  .crumbs a { color: #0969da; text-decoration: none; }
  .crumbs a:hover { text-decoration: underline; }
  .crumbs .sep { color: #59636e; margin: 0 6px; }
  .crumbs .current { font-weight: 600; }
  .meta { margin-top: 6px; font-size: 12px; color: #59636e; }
  .meta a { color: #0969da; }
  ul.entries { list-style: none; margin: 0; padding: 0; border: 1px solid #d1d9e0; border-radius: 8px; }
  ul.entries li { border-top: 1px solid #d1d9e0; }
  ul.entries li:first-child { border-top: 0; }
  ul.entries a {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 9px 14px; text-decoration: none; color: #0969da;
  }
  ul.entries a:hover { background: #f6f8fa; }
  ul.entries .size { color: #59636e; font-variant-numeric: tabular-nums; font-size: 12px; }
  ul.entries .dir { font-weight: 600; }
  pre.src {
    margin: 0; border: 1px solid #d1d9e0; border-radius: 8px; overflow: auto;
    background: #f6f8fa;
  }
  pre.src code { display: block; padding: 16px; font-size: 12.5px; line-height: 1.55;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace; }
  footer { margin-top: 24px; font-size: 12px; color: #59636e; }
  footer a { color: #0969da; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; color: #e6edf3; }
    header, ul.entries, ul.entries li, pre.src { border-color: #3d444d; }
    pre.src { background: #151b23; }
    ul.entries a:hover { background: #151b23; }
  }
`

function shell(title: string, base: string, body: string, head = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>${PAGE_CSS}</style>
${head}
</head>
<body>
<div class="wrap">
${body}
<footer>Source published from the repo &middot; <a href="${withBase(base, '/')}">Back to handbook</a></footer>
</div>
</body>
</html>`
}

const HLJS_HEAD = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github.min.css" media="(prefers-color-scheme: light)">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
<script src="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/lib/highlight.min.js" defer></script>
<script>document.addEventListener('DOMContentLoaded',function(){if(window.hljs){window.hljs.highlightAll()}})</script>`

export function renderSourcePage(
  relPath: string,
  source: string,
  base: string,
  rawHref: string,
): string {
  const ext = path.extname(relPath).toLowerCase()
  const lang = HLJS_LANG[ext]
  const cls = lang ? ` class="language-${lang}"` : ''
  const lines = source.split('\n').length
  return shell(
    `${path.basename(relPath)} — apps source`,
    base,
    `<header>
  <div class="crumbs">${breadcrumb(base, relPath)}</div>
  <div class="meta">${lines} lines &middot; ${formatBytes(Buffer.byteLength(source))} &middot; <a href="${rawHref}">raw</a></div>
</header>
<pre class="src"><code${cls}>${escapeHtml(source)}</code></pre>`,
    HLJS_HEAD,
  )
}

export type DirEntry = { name: string; href: string; isDir: boolean; size: number }

export function renderDirListing(relPath: string, entries: DirEntry[], base: string): string {
  const title = relPath ? `${relPath} — apps source` : 'apps — source browser'
  const rows = entries
    .map(
      (e) =>
        `<li><a href="${e.href}"><span class="${e.isDir ? 'dir' : 'file'}">${escapeHtml(
          e.isDir ? `${e.name}/` : e.name,
        )}</span><span class="size">${e.isDir ? '' : formatBytes(e.size)}</span></a></li>`,
    )
    .join('\n')
  return shell(
    title,
    base,
    `<header>
  <div class="crumbs">${relPath ? breadcrumb(base, relPath) : '<span class="current">apps</span>'}</div>
  <div class="meta">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
</header>
${entries.length ? `<ul class="entries">\n${rows}\n</ul>` : '<p>Empty directory.</p>'}`,
  )
}

/** Files above this size skip the highlighted view and are served raw. */
const MAX_VIEW_BYTES = 1_500_000

function isViewable(absPath: string, size: number): boolean {
  return !isBinary(absPath) && size <= MAX_VIEW_BYTES
}

function encodeSegments(rel: string): string {
  return rel.split('/').filter(Boolean).map(encodeURIComponent).join('/')
}

/** URL (site-absolute) at which a given repo-relative entry is browsable. */
function hrefFor(base: string, rel: string, name: string, isDir: boolean, viewable: boolean): string {
  const prefix = rel ? `${encodeSegments(rel)}/` : ''
  const encoded = encodeURIComponent(name)
  if (isDir) return withBase(base, `/apps/${prefix}${encoded}/`)
  if (!viewable) return withBase(base, `/apps/${prefix}${encoded}`)
  if (name === 'index.html') return withBase(base, `/apps/${prefix}${INDEX_HTML_VIEW_DIR}/`)
  return withBase(base, `/apps/${prefix}${encoded}/`)
}

function listDir(appsRoot: string, rel: string, base: string): DirEntry[] {
  const abs = path.resolve(appsRoot, rel)
  const dirents = fs.readdirSync(abs, { withFileTypes: true })
  return dirents
    .filter((d) => !isExcluded(d.name, d.isDirectory()))
    .map((d) => {
      const isDir = d.isDirectory()
      let size = 0
      if (!isDir) {
        try {
          size = fs.statSync(path.join(abs, d.name)).size
        } catch {
          /* unreadable */
        }
      }
      const viewable = isDir || isViewable(d.name, size)
      return { name: d.name, isDir, size, href: hrefFor(base, rel, d.name, isDir, viewable) }
    })
    .sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
    )
}

type Resolved =
  | { kind: 'dir'; rel: string; abs: string }
  | { kind: 'view'; rel: string; abs: string }
  | { kind: 'raw'; rel: string; abs: string }
  | { kind: 'asset'; rel: string; abs: string }
  | null

/**
 * Maps a `/apps/...` URL to what should be served. Mirrors the static layout
 * emitted at build time so dev, preview and GitHub Pages agree.
 */
function resolveRequest(appsRoot: string, rawRel: string): Resolved {
  let rel: string
  try {
    rel = decodeURIComponent(rawRel)
  } catch {
    return null
  }
  rel = rel.replace(/^\/+|\/+$/g, '')
  if (hasExcludedSegment(rel)) return null

  const statOf = (p: string) => {
    try {
      return fs.statSync(p)
    } catch {
      return null
    }
  }
  const inside = (p: string) => rel === '' || isInside(appsRoot, p)

  // `<file>/raw.txt` — plain-text sibling of the highlighted view.
  if (rel.endsWith(`/${RAW_FILE}`)) {
    const parentRel = rel.slice(0, -(RAW_FILE.length + 1))
    const target = resolveViewTarget(appsRoot, parentRel)
    if (target) return { kind: 'raw', rel: target.rel, abs: target.abs }
  }

  const abs = path.resolve(appsRoot, rel)
  if (!inside(abs)) return null
  const st = statOf(abs)

  // A real `index.html` file is shadowed by the directory listing (same path),
  // exactly as GitHub Pages would serve it.
  if (st?.isFile() && path.basename(rel) === 'index.html') {
    const parentRel = path.dirname(rel) === '.' ? '' : path.dirname(rel)
    return { kind: 'dir', rel: parentRel, abs: path.resolve(appsRoot, parentRel) }
  }
  if (st?.isDirectory()) return { kind: 'dir', rel, abs }
  if (st?.isFile()) {
    return isViewable(abs, st.size)
      ? { kind: 'view', rel, abs }
      : { kind: 'asset', rel, abs }
  }

  // Not a real path: could be the synthetic view directory for a source file.
  const target = resolveViewTarget(appsRoot, rel)
  return target ? { kind: 'view', rel: target.rel, abs: target.abs } : null
}

/** Resolves a synthetic view directory (`<file>/` or `<dir>/index.html--source/`). */
function resolveViewTarget(
  appsRoot: string,
  rel: string,
): { rel: string; abs: string } | null {
  const clean = rel.replace(/^\/+|\/+$/g, '')
  if (!clean || hasExcludedSegment(clean)) return null

  const candidates: string[] = [clean]
  if (path.basename(clean) === INDEX_HTML_VIEW_DIR) {
    const parent = path.dirname(clean)
    candidates.push(parent === '.' ? 'index.html' : `${parent}/index.html`)
  }

  for (const candidate of candidates) {
    const abs = path.resolve(appsRoot, candidate)
    if (!isInside(appsRoot, abs)) continue
    try {
      const st = fs.statSync(abs)
      if (st.isFile() && isViewable(abs, st.size)) return { rel: candidate, abs }
    } catch {
      /* missing */
    }
  }
  return null
}

function notFoundPage(base: string, pathname: string): string {
  return shell(
    'Not found — apps source',
    base,
    `<header><div class="crumbs"><span class="current">Not found</span></div></header>
<p>No source file at <code>${escapeHtml(pathname)}</code>.</p>
<p><a href="${withBase(base, '/apps/')}">Browse all app sources</a></p>`,
  )
}

function createAppsHandler(getRoot: () => string, getBase: () => string): ConnectLikeHandle {
  return (req, res, next) => {
    const appsRoot = findAppsRoot(getRoot())
    if (!fs.existsSync(appsRoot)) {
      next()
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }

    const rawUrl = req.url ?? '/'
    const qIndex = rawUrl.indexOf('?')
    const rawPath = qIndex === -1 ? rawUrl : rawUrl.slice(0, qIndex)
    const search = qIndex === -1 ? '' : rawUrl.slice(qIndex)
    const base = getBase()
    const pathname = stripViteBase(rawPath, base)

    if (pathname !== '/apps' && !pathname.startsWith(URL_PREFIX)) {
      next()
      return
    }

    const redirect = (to: string) => {
      res.statusCode = 302
      res.setHeader('Location', to)
      res.end()
    }

    if (pathname === '/apps') {
      redirect(withBase(base, '/apps/') + search)
      return
    }

    const relRaw = pathname.slice(URL_PREFIX.length)
    const hadTrailingSlash = relRaw === '' || relRaw.endsWith('/')
    const resolved = resolveRequest(appsRoot, relRaw)

    const sendHtml = (html: string, status = 200) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(req.method === 'HEAD' ? undefined : html)
    }

    if (!resolved) {
      sendHtml(notFoundPage(base, pathname), 404)
      return
    }

    // GitHub Pages serves a real `index.html` directly; everything else gets
    // the canonical trailing slash so `./raw.txt` resolves correctly.
    const servedDirectly = path.basename(relRaw.replace(/\/+$/, '')) === 'index.html'
    if (!hadTrailingSlash && !servedDirectly && resolved.kind !== 'asset' && resolved.kind !== 'raw') {
      redirect(withBase(base, `${pathname}/`) + search)
      return
    }

    if (resolved.kind === 'dir') {
      sendHtml(renderDirListing(resolved.rel, listDir(appsRoot, resolved.rel, base), base))
      return
    }
    if (resolved.kind === 'view') {
      const source = fs.readFileSync(resolved.abs, 'utf8')
      sendHtml(renderSourcePage(resolved.rel, source, base, `./${RAW_FILE}`))
      return
    }
    if (resolved.kind === 'raw') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(resolved.abs))
      return
    }

    res.statusCode = 200
    res.setHeader(
      'Content-Type',
      BINARY_MIME[path.extname(resolved.abs).toLowerCase()] ?? 'application/octet-stream',
    )
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    fs.createReadStream(resolved.abs).pipe(res)
  }
}

/** Emits the static mirror of the source browser into the build output. */
function emitStaticSourceBrowser(appsRoot: string, outDir: string, base: string): number {
  let written = 0

  const write = (relOut: string, contents: string | Buffer) => {
    const dest = path.join(outDir, 'apps', relOut)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, contents)
    written++
  }

  const walk = (rel: string) => {
    write(
      path.join(rel, 'index.html'),
      renderDirListing(rel, listDir(appsRoot, rel, base), base),
    )

    for (const dirent of fs.readdirSync(path.resolve(appsRoot, rel), { withFileTypes: true })) {
      const isDir = dirent.isDirectory()
      if (isExcluded(dirent.name, isDir)) continue
      const childRel = rel ? `${rel}/${dirent.name}` : dirent.name
      const abs = path.resolve(appsRoot, childRel)

      if (isDir) {
        walk(childRel)
        continue
      }
      if (!dirent.isFile()) continue

      const size = fs.statSync(abs).size
      if (!isViewable(abs, size)) {
        write(childRel, fs.readFileSync(abs))
        continue
      }

      // `<dir>/index.html` is taken by the directory listing — move the view aside.
      const viewDir =
        dirent.name === 'index.html'
          ? path.join(rel, INDEX_HTML_VIEW_DIR)
          : childRel
      const source = fs.readFileSync(abs, 'utf8')
      write(path.join(viewDir, 'index.html'), renderSourcePage(childRel, source, base, `./${RAW_FILE}`))
      write(path.join(viewDir, RAW_FILE), source)
    }
  }

  walk('')
  return written
}

/**
 * Serves `apps/` as a browsable source viewer at `/apps/*` in dev, preview and
 * the static GitHub Pages build.
 */
export function appsSourcePlugin(): Plugin {
  let appsRootForBuild = ''
  let outDir = ''
  let baseForBuild = '/'
  let isSsrBuild = false

  return {
    name: 'apps-source',
    enforce: 'pre',
    configResolved(config: ResolvedConfig) {
      appsRootForBuild = findAppsRoot(config.root)
      outDir = config.build.outDir
      baseForBuild = config.base
      // VitePress builds client + SSR bundles; only the client output ships.
      isSsrBuild = Boolean(config.build.ssr)
    },
    configureServer(server) {
      prependMiddleware(
        server,
        createAppsHandler(
          () => server.config.root,
          () => server.config.base,
        ),
      )
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address()
        const port = addr && typeof addr === 'object' && 'port' in addr ? String(addr.port) : '?'
        const ar = findAppsRoot(server.config.root)
        console.log(
          `  [apps] source browser ${fs.existsSync(ar) ? 'OK' : 'MISSING'}: ${ar}\n` +
            `  [apps] browse → http://localhost:${port}/apps/\n`,
        )
      })
    },
    configurePreviewServer(server) {
      prependMiddleware(
        server,
        createAppsHandler(
          () => server.config.root,
          () => server.config.base,
        ),
      )
    },
    closeBundle() {
      if (isSsrBuild) return
      if (!outDir || !appsRootForBuild || !fs.existsSync(appsRootForBuild)) return
      const written = emitStaticSourceBrowser(appsRootForBuild, outDir, baseForBuild)
      console.log(`  [apps] emitted ${written} source-browser files into ${outDir}/apps`)
    },
  }
}
