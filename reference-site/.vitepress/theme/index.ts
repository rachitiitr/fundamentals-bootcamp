import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'

/** Path prefixes served as real files (middleware in dev, static files in the build). */
const STATIC_SEGMENTS = ['learnings', 'apps'] as const

function isStaticFileNavigation(href: string): boolean {
  const pathOnly = href.split('#')[0]?.split('?')[0] ?? ''
  return STATIC_SEGMENTS.some(
    (seg) => pathOnly.includes(`/${seg}/`) || pathOnly.endsWith(`/${seg}`),
  )
}

/**
 * `/learnings/*` and `/apps/*` are served as real files, not VitePress routes.
 * VitePress uses a custom `router` (not vue-router): use `onBeforeRouteChange`, not `beforeEach`.
 */
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ router }) {
    if (typeof window === 'undefined' || !router) return
    const prev = router.onBeforeRouteChange
    router.onBeforeRouteChange = async (href: string) => {
      if (isStaticFileNavigation(href)) {
        window.location.assign(href)
        return false
      }
      return await prev?.(href)
    }
  },
} satisfies Theme
