import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { buildJavascriptLessonSidebar } from './lesson-sidebar'
import { learningsStaticPlugin } from './learnings-static-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const mainSidebar = [
  {
    text: 'Start here',
    items: [
      { text: 'Home', link: '/' },
      {
        text: 'Interview syllabus (master list)',
        link: '/topics/interview-syllabus/',
      },
      { text: 'How to use this repo', link: '/how-to-use-this-repo' },
      {
        text: 'JavaScript lessons (sidebar)',
        link: '/lessons/javascript/01-async-generators/NOTES',
      },
    ],
  },
  {
    text: 'Language hubs',
    items: [
      { text: 'JavaScript', link: '/topics/javascript/' },
      { text: 'Python', link: '/topics/python/' },
      { text: 'C++', link: '/topics/cpp/' },
    ],
  },
  {
    text: 'Python topics',
    items: [
      {
        text: 'Dunder methods (hooks, JS & C++ parallels)',
        link: '/topics/python-dunder-methods/',
      },
      {
        text: 'with & context managers',
        link: '/topics/python-context-managers/',
      },
    ],
  },
  {
    text: 'C++ topics',
    items: [
      {
        text: 'Virtual tables (vtables)',
        link: '/topics/cpp-vtables/',
      },
      {
        text: 'Struct layout, padding & alignment',
        link: '/topics/cpp-struct-layout/',
      },
    ],
  },
  {
    text: 'Cross-language topics',
    items: [
      {
        text: 'Iterators & generators',
        link: '/topics/iterators-and-generators/',
      },
      {
        text: 'Dynamic dispatch & object models',
        link: '/topics/dynamic-dispatch-and-object-model/',
      },
      { text: 'Multiset & ordered duplicates', link: '/topics/multiset/' },
    ],
  },
  {
    text: 'Systems & OS',
    items: [
      {
        text: 'Virtual memory, paging & segmentation',
        link: '/topics/virtual-memory/',
      },
    ],
  },
]

export default withMermaid(
  defineConfig({
  title: 'Prep Bootcamp — Reference',
  description:
    'Quick refresh notes across JavaScript, Python, and C++ — topics, comparisons, and interview patterns.',
  cleanUrls: true,
  ignoreDeadLinks: true,
  /** Optional Mermaid defaults for all ```mermaid``` blocks in Markdown */
  mermaid: {
    theme: 'neutral',
    securityLevel: 'loose',
  },
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
    server: {
      port: 5180,
      strictPort: false,
      fs: {
        allow: [path.resolve(__dirname, '..'), repoRoot],
      },
    },
    plugins: [learningsStaticPlugin()],
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Syllabus', link: '/topics/interview-syllabus/' },
      { text: 'Topics', link: '/topics/iterators-and-generators/' },
      { text: 'JS lessons', link: '/lessons/javascript/01-async-generators/NOTES' },
    ],
    sidebar: {
      '/lessons/': buildJavascriptLessonSidebar(),
      '/': mainSidebar,
    },
    socialLinks: [],
    footer: {
      message: 'Personal learnings monorepo',
    },
    search: {
      provider: 'local',
    },
  },
  })
)
