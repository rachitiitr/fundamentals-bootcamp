import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DefaultTheme } from 'vitepress'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Symlink: `reference-site/lessons/javascript` → repo `learnings/javascript/lessons`. */
export function buildJavascriptLessonSidebar(): DefaultTheme.SidebarItem[] {
  const lessonsDir = path.resolve(__dirname, '../lessons/javascript')
  if (!fs.existsSync(lessonsDir)) {
    return [
      {
        text: 'Lessons folder missing',
        link: '/how-to-use-this-repo',
      },
    ]
  }

  const entries = fs.readdirSync(lessonsDir, { withFileTypes: true })
  const groups: DefaultTheme.SidebarItem[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue
    const slug = entry.name
    const dir = path.join(lessonsDir, slug)
    const items: DefaultTheme.SidebarItem[] = []

    if (fs.existsSync(path.join(dir, 'NOTES.md'))) {
      items.push({ text: 'NOTES', link: `/lessons/javascript/${slug}/NOTES` })
    }
    if (fs.existsSync(path.join(dir, 'README.md'))) {
      items.push({ text: 'README', link: `/lessons/javascript/${slug}/README` })
    }

    for (const ex of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (!ex.isDirectory()) continue
      const exDir = path.join(dir, ex.name)
      if (fs.existsSync(path.join(exDir, 'index.html'))) {
        items.push({
          text: ex.name,
          link: `/learnings/javascript/lessons/${slug}/${ex.name}/index.html`,
        })
      }
    }

    groups.push({
      text: slug,
      collapsed: slug !== '02-workers',
      items,
    })
  }

  return [
    { text: '← JavaScript hub', link: '/topics/javascript/' },
    { text: 'Handbook home', link: '/' },
    { text: 'JavaScript lessons', items: groups },
  ]
}
