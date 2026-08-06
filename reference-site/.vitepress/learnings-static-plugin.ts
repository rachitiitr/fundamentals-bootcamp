import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import MarkdownIt from 'markdown-it'
import type { Plugin, ResolvedConfig } from 'vite'

const md = new MarkdownIt({
  html: true,
  linkify: true,
})

/** Lesson `.md` under this path are VitePress pages at `/lessons/javascript/...` (symlinked). */
const JS_LESSON_MD_PREFIX = '/learnings/javascript/lessons/'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownFileToHtml(filePath: string, source: string): string {
  const body = md.render(source)
  const stem = path.basename(filePath, '.md')
  const titleMatch = source.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : stem
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css">
<style>
  body { margin: 0; background: #fff; }
  .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 32px 24px 24px; }
</style>
</head>
<body>
<article class="markdown-body">${body}</article>
<p class="markdown-body" style="font-size: 13px; color: #57606a; max-width: 980px; margin: 0 auto 48px; padding: 0 24px;">
  Not a VitePress page — rendered from the repo. Add <code>?raw=1</code> for plain Markdown.
  <a href="/">Back to handbook</a>
</p>
</body>
</html>`
}

function findLearningsRoot(viteRoot: string): string {
  let dir = path.resolve(viteRoot)
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, 'learnings')
    if (fs.existsSync(path.join(candidate, 'javascript', 'lessons'))) {
      return candidate
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(viteRoot, '../learnings')
}

export function stripViteBase(urlPath: string, base: string): string {
  if (!base || base === '/') return urlPath
  const nb = base.replace(/\/+$/, '')
  if (!nb || nb === '/') return urlPath
  if (urlPath === nb || urlPath.startsWith(`${nb}/`)) {
    const rest = urlPath === nb ? '/' : urlPath.slice(nb.length)
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return urlPath
}

function isInsideLearnings(root: string, filePath: string): boolean {
  const rel = path.relative(root, filePath)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function resolveLearningsFile(learningsRoot: string, rel: string): string | null {
  const decoded = decodeURIComponent(rel.replace(/^\/+/, ''))
  const base = path.resolve(learningsRoot, decoded)
  if (!isInsideLearnings(learningsRoot, base)) return null

  const tryPaths = [
    base,
    base + '.md',
    path.join(base, 'index.html'),
    path.join(base, 'README.md'),
  ]

  for (const p of tryPaths) {
    if (!isInsideLearnings(learningsRoot, p)) continue
    try {
      const st = fs.statSync(p)
      if (st.isFile()) return p
    } catch {
      /* missing */
    }
  }
  return null
}

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

type StackLayer = { route: string; handle: ConnectLikeHandle }
export type ConnectLikeHandle = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void

function createLearningsHandler(getRoot: () => string, getBase: () => string): ConnectLikeHandle {
  return (req, res, next) => {
    const learningsRoot = findLearningsRoot(getRoot())
    if (!fs.existsSync(learningsRoot)) {
      next()
      return
    }

    const raw = req.url?.split('?')[0] ?? '/'
    const pathname = stripViteBase(raw, getBase())

    if (!pathname.startsWith('/learnings/')) {
      next()
      return
    }

    const rel = pathname.slice('/learnings/'.length)
    const filePath = resolveLearningsFile(learningsRoot, rel)
    if (!filePath) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    const ext = path.extname(filePath)
    const url = new URL(req.url ?? '/', 'http://vitepress.local')
    const wantsRawMd = ext === '.md' && url.searchParams.get('raw') === '1'

    if (
      pathname.startsWith(JS_LESSON_MD_PREFIX) &&
      ext === '.md' &&
      !wantsRawMd &&
      (req.method === 'GET' || req.method === 'HEAD')
    ) {
      const rest = pathname.slice(JS_LESSON_MD_PREFIX.length)
      res.statusCode = 302
      res.setHeader('Location', `/lessons/javascript/${rest}${url.search}`)
      res.end()
      return
    }

    if (ext === '.md' && !wantsRawMd) {
      if (req.method === 'HEAD') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end()
        return
      }
      if (req.method === 'GET') {
        const source = fs.readFileSync(filePath, 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(markdownFileToHtml(filePath, source))
        return
      }
    }

    res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream')
    fs.createReadStream(filePath).pipe(res)
  }
}

export function prependMiddleware(
  server: { middlewares: { use: (h: ConnectLikeHandle) => void; stack: StackLayer[] } },
  handler: ConnectLikeHandle,
) {
  server.middlewares.use(handler)
  const stack = server.middlewares.stack
  const idx = stack.findIndex((l) => l.handle === handler)
  if (idx > 0) {
    const [layer] = stack.splice(idx, 1)
    stack.unshift(layer)
  }
}

/**
 * Serves `learnings/` at `/learnings/*` for HTML/JS (workers). Lesson `.md` under
 * `/learnings/javascript/lessons/` redirects to VitePress `/lessons/javascript/...`.
 */
export function learningsStaticPlugin(): Plugin {
  let learningsRootForBuild = ''
  let outDir = ''

  return {
    name: 'learnings-static',
    enforce: 'pre',
    configResolved(config: ResolvedConfig) {
      learningsRootForBuild = findLearningsRoot(config.root)
      outDir = config.build.outDir
    },
    configureServer(server) {
      const handler = createLearningsHandler(
        () => server.config.root,
        () => server.config.base,
      )
      prependMiddleware(server, handler)

      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address()
        const port =
          addr && typeof addr === 'object' && 'port' in addr ? String(addr.port) : '?'
        const lr = findLearningsRoot(server.config.root)
        const ok = fs.existsSync(lr)
        console.log(
          `\n  [learnings] root ${ok ? 'OK' : 'MISSING'}: ${lr}
  [learnings] handbook lessons (sidebar) → http://localhost:${port}/lessons/javascript/01-async-generators/NOTES
  [learnings] worker HTML (same server) → http://localhost:${port}/learnings/javascript/lessons/02-workers/01-hello/index.html
`,
        )
      })
    },
    configurePreviewServer(server) {
      const handler = createLearningsHandler(
        () => server.config.root,
        () => server.config.base,
      )
      prependMiddleware(server, handler)
    },
    closeBundle() {
      const lr = learningsRootForBuild
      if (!outDir || !lr || !fs.existsSync(lr)) return
      const dest = path.join(outDir, 'learnings')
      fs.cpSync(lr, dest, { recursive: true })
    },
  }
}
