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
    text: 'JavaScript topics',
    items: [
      {
        text: 'Object APIs, descriptors, Proxy & cloning',
        link: '/topics/javascript-objects-interview/',
      },
      {
        text: '`this` binding (four rules, arrows, prototypes)',
        link: '/topics/javascript-this-binding/',
      },
      {
        text: 'Event loop, microtasks & real-time UIs',
        link: '/topics/browser-event-loop/',
      },
      {
        text: 'Frame pipeline — rAF, rIC & useLayoutEffect',
        link: '/topics/browser-frame-pipeline/',
      },
    ],
  },
  {
    text: 'React topics',
    items: [
      {
        text: '`cloneElement` & slot-style parents (tabs)',
        link: '/topics/react-clone-element/',
      },
      {
        text: '`useLayoutEffect` vs `useEffect` (frame pipeline)',
        link: '/topics/browser-frame-pipeline/',
      },
    ],
  },
  {
    text: 'Frontend security (4-beat series)',
    items: [
      {
        text: 'Series hub — threat model & roadmap',
        link: '/topics/frontend-security/',
      },
      {
        text: 'Beat 1 — XSS & injection',
        link: '/topics/frontend-security-xss/',
      },
      {
        text: 'Beat 2 — Cross-origin (SOP, CORS, CSRF, clickjacking)',
        link: '/topics/frontend-security-cross-origin/',
      },
      {
        text: 'Beat 3+4 — Auth, headers & supply chain',
        link: '/topics/frontend-security-auth-and-headers/',
      },
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
      {
        text: 'GIL — what it protects, when threads still help',
        link: '/topics/python-gil/',
      },
      {
        text: 'asyncio — loop, tasks, cancellation, queues',
        link: '/topics/python-asyncio/',
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
  {
    text: 'System design',
    items: [
      {
        text: 'Stock price fan-out (HRT-flavored walkthrough)',
        link: '/topics/system-design-stock-notifications/',
      },
    ],
  },
  {
    text: 'System design tradeoffs (Principal series)',
    items: [
      {
        text: 'Series hub — 9 beats',
        link: '/topics/system-design-tradeoffs/',
      },
      {
        text: 'Beat 1 — Foundations (CAP, PACELC)',
        link: '/topics/system-design-foundations/',
      },
      {
        text: 'Beat 2 — Data & storage',
        link: '/topics/system-design-data-storage/',
      },
      {
        text: 'Beat 3 — Caching & performance',
        link: '/topics/system-design-caching/',
      },
      {
        text: 'Beat 4 — Async, messaging & decoupling',
        link: '/topics/system-design-async-messaging/',
      },
      {
        text: 'Beat 5 — Reliability & failure',
        link: '/topics/system-design-reliability/',
      },
      {
        text: 'Beat 6 — Coordination & consensus',
        link: '/topics/system-design-coordination/',
      },
      {
        text: 'Beat 7 — Scale & topology',
        link: '/topics/system-design-scale-topology/',
      },
      {
        text: 'Beat 8 — Cross-cutting patterns',
        link: '/topics/system-design-cross-cutting/',
      },
      {
        text: 'Beat 9 — Interview framework & meta-skills',
        link: '/topics/system-design-interview-framework/',
      },
    ],
  },
  {
    text: 'Distributed systems',
    items: [
      {
        text: 'Message queues — log vs queue, partitions, consumer groups',
        link: '/topics/distributed-message-queues/',
      },
      {
        text: 'Delivery semantics & idempotency',
        link: '/topics/distributed-delivery-and-idempotency/',
      },
      {
        text: 'Batch & stream compute — MapReduce, Spark, worker failure',
        link: '/topics/distributed-batch-and-stream-compute/',
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
