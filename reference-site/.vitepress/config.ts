import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Prep Bootcamp — Reference',
  description:
    'Quick refresh notes across JavaScript, Python, and C++ — topics, comparisons, and interview patterns.',
  cleanUrls: true,
  // Topic pages link to lesson sources outside this package; those paths are not VitePress routes.
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Topics', link: '/topics/iterators-and-generators/' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Home', link: '/' },
          { text: 'How to use this repo', link: '/how-to-use-this-repo' },
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
    ],
    socialLinks: [],
    footer: {
      message: 'Personal learnings monorepo',
    },
    search: {
      provider: 'local',
    },
  },
})
