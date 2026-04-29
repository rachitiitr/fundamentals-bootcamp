import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { buildJavascriptLessonSidebar } from './lesson-sidebar'
import { learningsStaticPlugin } from './learnings-static-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const mainSidebar = [
  {
    text: 'Start here',
    items: [
      { text: 'Home', link: '/' },
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
    text: 'Cross-language topics',
    items: [
      {
        text: 'Iterators & generators',
        link: '/topics/iterators-and-generators/',
      },
      { text: 'Multiset & ordered duplicates', link: '/topics/multiset/' },
    ],
  },
]

export default defineConfig({
  title: 'Prep Bootcamp — Reference',
  description:
    'Quick refresh notes across JavaScript, Python, and C++ — topics, comparisons, and interview patterns.',
  cleanUrls: true,
  ignoreDeadLinks: true,
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
