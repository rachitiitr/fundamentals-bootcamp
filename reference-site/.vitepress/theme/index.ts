import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'

function isLearningsNavigation(href: string): boolean {
  const pathOnly = href.split('#')[0]?.split('?')[0] ?? ''
  return pathOnly.includes('/learnings/') || pathOnly.endsWith('/learnings')
}

/**
 * `/learnings/*` is served by the dev middleware as real files, not VitePress routes.
 * VitePress uses a custom `router` (not vue-router): use `onBeforeRouteChange`, not `beforeEach`.
 */
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ router }) {
    if (typeof window === 'undefined' || !router) return
    const prev = router.onBeforeRouteChange
    router.onBeforeRouteChange = async (href: string) => {
      if (isLearningsNavigation(href)) {
        window.location.assign(href)
        return false
      }
      return await prev?.(href)
    }
  },
} satisfies Theme
