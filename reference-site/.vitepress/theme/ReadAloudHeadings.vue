<script setup lang="ts">
/**
 * Read aloud: per-heading Listen, optional selection (FAB + ⌃⇧L / ⌘⇧L),
 * browser Speech Synthesis or voice-playground POST /api/synthesize.
 * While playing: fixed toolbar — Pause/Resume, slower/faster (same prefs rate), Stop.
 * Shortcuts: ⌘/Ctrl+B sidebar, ⌘/Ctrl+⇧L selection, while playing ⌘/Ctrl+Enter stop, Enter pause/resume,
 * Shift+< / Shift+> (or Shift+, / Shift+.) speed down/up.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { inBrowser, onContentUpdated, useRoute } from 'vitepress'
import { useSidebar } from 'vitepress/theme'

const route = useRoute()
const sidebar = useSidebar()

const DOC_SELECTOR = 'main .vp-doc'

const LS_USE_VOICE_API = 'prep-read-aloud-use-voice-api'
const LS_VOICE_API_BASE = 'prep-read-aloud-voice-api-base'
const LS_VOICE_ENGINE = 'prep-read-aloud-voice-engine'
const LS_SPEECH_RATE = 'prep-read-aloud-speech-rate'

const DEFAULT_VOICE_API_BASE = 'http://localhost:8321'
const MAX_SYNTH_CHARS = 5000

/** Browser `SpeechSynthesisUtterance.rate` and `<audio>.playbackRate` (applied on play; audio updates live). */
const RATE_MIN = 0.5
const RATE_MAX = 2
const RATE_DEFAULT = 1
const RATE_STEP = 0.1

const BTN_CLASS = 'read-aloud-section-btn'
const HEADING_CLASS = 'vp-heading-with-read-aloud'

const LABEL_LISTEN = 'Listen'
const LABEL_STOP = 'Stop'
const ARIA_LISTEN =
  'Read this section aloud, from this heading until the next section heading'
const ARIA_STOP = 'Stop reading aloud'
const TITLE_LISTEN = 'Read this section aloud (skips code blocks)'
const TITLE_STOP = 'Stop speech (Escape also stops)'

const LABEL_SELECTION_LISTEN = 'Listen to selection'
const ARIA_SELECTION_LISTEN = 'Read the selected text aloud'
const TITLE_SELECTION_LISTEN = 'Uses the same voice settings as section Listen'

function normalizeBase(url: string): string {
  const t = url.trim().replace(/\/+$/, '')
  return t || DEFAULT_VOICE_API_BASE
}

function readUseVoiceApi(): boolean {
  if (!inBrowser) return false
  return localStorage.getItem(LS_USE_VOICE_API) === 'true'
}

function writeUseVoiceApi(v: boolean) {
  localStorage.setItem(LS_USE_VOICE_API, v ? 'true' : 'false')
}

function readVoiceApiBase(): string {
  if (!inBrowser) return DEFAULT_VOICE_API_BASE
  return normalizeBase(localStorage.getItem(LS_VOICE_API_BASE) || DEFAULT_VOICE_API_BASE)
}

function readVoiceEngine(): string {
  if (!inBrowser) return 'piper'
  const e = (localStorage.getItem(LS_VOICE_ENGINE) || 'piper').toLowerCase()
  if (e === 'edge' || e === 'chatterbox') return e
  return 'piper'
}

function clampSpeechRate(n: number): number {
  const r = Math.round(n * 10) / 10
  return Math.min(RATE_MAX, Math.max(RATE_MIN, r))
}

function readSpeechRateFromStorage(): number {
  if (!inBrowser) return RATE_DEFAULT
  const v = parseFloat(localStorage.getItem(LS_SPEECH_RATE) || '')
  if (!Number.isFinite(v)) return RATE_DEFAULT
  return clampSpeechRate(v)
}

const mounted = ref(false)
const prefsOpen = ref(false)
/** Shown in prefs hint for selection shortcut */
const selectionShortcutLabel = ref('Ctrl+Shift+L')
/** Modifier glyph for hints (Cmd vs Ctrl). */
const modKeyLabel = ref('Ctrl+')

const useVoiceApi = computed({
  get: () => readUseVoiceApi(),
  set: (v: boolean) => {
    writeUseVoiceApi(v)
  }
})

const voiceApiBaseInput = ref(DEFAULT_VOICE_API_BASE)
const voiceEngine = ref('piper')
const speechRate = ref(RATE_DEFAULT)

function syncPrefsFromStorage() {
  voiceApiBaseInput.value = readVoiceApiBase()
  voiceEngine.value = readVoiceEngine()
  speechRate.value = readSpeechRateFromStorage()
}

function persistVoiceApiBase() {
  const b = normalizeBase(voiceApiBaseInput.value)
  voiceApiBaseInput.value = b
  localStorage.setItem(LS_VOICE_API_BASE, b)
}

function persistVoiceEngine() {
  localStorage.setItem(LS_VOICE_ENGINE, voiceEngine.value)
}

watch(voiceEngine, () => {
  persistVoiceEngine()
})

function bumpSpeechRate(delta: number) {
  speechRate.value = clampSpeechRate(speechRate.value + delta)
}

function resetSpeechRate() {
  speechRate.value = RATE_DEFAULT
}

function headingLevel(el: Element): number {
  const m = /^H([1-6])$/i.exec(el.tagName)
  return m ? Number(m[1]) : 0
}

function isHeading(el: Element): boolean {
  return headingLevel(el) > 0
}

function headingTextWithoutControls(h: HTMLElement): string {
  const clone = h.cloneNode(true) as HTMLElement
  clone.querySelectorAll(`.${BTN_CLASS}`).forEach((b) => b.remove())
  return cleanSpeechText((clone.textContent ?? '').replace(/\s+/g, ' ').trim())
}

/** Mermaid injects <style>#mermaid-N…</style> and SVG; innerText can otherwise include huge CSS. */
function stripNonSpeakableFromClone(root: HTMLElement) {
  root.querySelectorAll('pre').forEach((p) => p.remove())
  root.querySelectorAll('style').forEach((p) => p.remove())
  root.querySelectorAll('svg').forEach((p) => p.remove())
  root.querySelectorAll('script, canvas, noscript').forEach((p) => p.remove())
  root.querySelectorAll('.mermaid, [class*="mermaid"]').forEach((p) => p.remove())
  root.querySelectorAll('[id^="mermaid-"]').forEach((p) => p.remove())
}

function cleanSpeechText(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00AD/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractReadableText(root: HTMLElement): string {
  const c = root.cloneNode(true) as HTMLElement
  stripNonSpeakableFromClone(c)
  return cleanSpeechText(
    (c.innerText ?? c.textContent ?? '')
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
  )
}

function collectSectionElements(startHeading: HTMLElement): HTMLElement[] {
  const level = headingLevel(startHeading)
  const out: HTMLElement[] = [startHeading]
  let el: Element | null = startHeading.nextElementSibling
  while (el) {
    if (isHeading(el) && headingLevel(el) <= level) break
    out.push(el as HTMLElement)
    el = el.nextElementSibling
  }
  return out
}

function sectionPlainText(startHeading: HTMLElement): string {
  const chunks = collectSectionElements(startHeading).map((node, i) =>
    i === 0 ? headingTextWithoutControls(node) : extractReadableText(node)
  )
  return cleanSpeechText(chunks.filter(Boolean).join('\n\n'))
}

function getDocRoot(): HTMLElement | null {
  return document.querySelector(DOC_SELECTOR) as HTMLElement | null
}

function selectionFullyInsideDoc(sel: Selection): boolean {
  const doc = getDocRoot()
  if (!doc || !sel.anchorNode || !sel.focusNode) return false
  return doc.contains(sel.anchorNode) && doc.contains(sel.focusNode)
}

function extractTextFromSelection(sel: Selection): string {
  if (!sel.rangeCount || sel.isCollapsed) return ''
  const range = sel.getRangeAt(0)
  const frag = range.cloneContents()
  const wrap = document.createElement('div')
  wrap.appendChild(frag)
  stripNonSpeakableFromClone(wrap)
  return cleanSpeechText(
    (wrap.innerText ?? wrap.textContent ?? '')
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
  )
}

function getSelectionSpeechText(): string {
  const sel = window.getSelection()
  if (!sel || !selectionFullyInsideDoc(sel)) return ''
  return extractTextFromSelection(sel)
}

function pickEnVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0] ??
    null
  )
}

let activeSectionButton: HTMLButtonElement | null = null
let activeAudio: HTMLAudioElement | null = null
let fetchAbort: AbortController | null = null
const apiInFlight = ref(false)
/** True while selection (not section heading) is playing or fetching */
const selectionPlaybackActive = ref(false)
/** Non-empty speakable text selected inside .vp-doc */
const hasSelectableText = ref(false)

/** Vue-visible browser TTS session (speechSynthesis.* is not reactive). */
const browserPlaybackActive = ref(false)
/** Last browser utterance text + UI binding (for rate changes mid-play). */
const lastBrowserCtx = ref<{ text: string; sectionButton: HTMLButtonElement | null } | null>(null)
/** Invalidates in-flight browser utterance onend handlers after cancel / new speak. */
let browserUtterGen = 0

/** Voice API: audio is playing (or paused), not just fetching. */
const voiceApiPlaybackActive = ref(false)

/** Bumped so toolbar Pause label tracks <audio>.paused and speechSynthesis.paused. */
const playbackUiTick = ref(0)

function persistSpeechRate() {
  const c = clampSpeechRate(speechRate.value)
  if (c !== speechRate.value) speechRate.value = c
  localStorage.setItem(LS_SPEECH_RATE, String(c))
  if (activeAudio) activeAudio.playbackRate = c
}

let rateRestartTimer: ReturnType<typeof setTimeout> | undefined

watch(speechRate, () => {
  persistSpeechRate()
  clearTimeout(rateRestartTimer)
  rateRestartTimer = setTimeout(() => {
    if (
      lastBrowserCtx.value &&
      browserPlaybackActive.value &&
      !readUseVoiceApi() &&
      (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused)
    ) {
      restartBrowserUtteranceWithCurrentRate()
    }
  }, 140)
})

let selectionDebounce: ReturnType<typeof setTimeout> | undefined

function scheduleSelectionUiUpdate() {
  if (!inBrowser) return
  clearTimeout(selectionDebounce)
  selectionDebounce = setTimeout(() => {
    const t = getSelectionSpeechText().slice(0, MAX_SYNTH_CHARS).trim()
    hasSelectableText.value = t.length > 0
  }, 120)
}

const showSelectionFab = computed(
  () => hasSelectableText.value || selectionPlaybackActive.value
)

const playbackPaused = computed(() => {
  void playbackUiTick.value
  if (!inBrowser) return false
  if (activeAudio && !activeAudio.ended) return activeAudio.paused
  return speechSynthesis.paused
})

function resetButtonToListen(btn: HTMLButtonElement) {
  btn.textContent = LABEL_LISTEN
  btn.setAttribute('aria-label', ARIA_LISTEN)
  btn.title = TITLE_LISTEN
  btn.classList.remove('is-speaking')
  btn.setAttribute('aria-pressed', 'false')
}

function setButtonToStop(btn: HTMLButtonElement) {
  btn.textContent = LABEL_STOP
  btn.setAttribute('aria-label', ARIA_STOP)
  btn.title = TITLE_STOP
  btn.classList.add('is-speaking')
  btn.setAttribute('aria-pressed', 'true')
}

function clearSpeakingState() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.removeAttribute('src')
    activeAudio.load()
    activeAudio = null
  }
  if (activeSectionButton) resetButtonToListen(activeSectionButton)
  activeSectionButton = null
  selectionPlaybackActive.value = false
  browserPlaybackActive.value = false
  lastBrowserCtx.value = null
  voiceApiPlaybackActive.value = false
}

function stopSpeech() {
  browserUtterGen++
  speechSynthesis.cancel()
  fetchAbort?.abort()
  fetchAbort = null
  apiInFlight.value = false
  clearSpeakingState()
  playbackUiTick.value++
}

function isSpeakingOrQueued(): boolean {
  if (!inBrowser) return false
  if (apiInFlight.value) return true
  if (activeAudio && !activeAudio.ended) return true
  return speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused
}

function isEditableKeyboardTarget(ev: KeyboardEvent): boolean {
  const t = ev.target
  if (!t || !(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return !!t.closest('input, textarea, select, [contenteditable="true"]')
}

const showPlaybackToolbar = computed(
  () => mounted.value && inBrowser && isSpeakingOrQueued()
)

function togglePauseResume() {
  if (!inBrowser) return
  if (activeAudio && !activeAudio.ended) {
    if (activeAudio.paused) void activeAudio.play()
    else activeAudio.pause()
    playbackUiTick.value++
    return
  }
  if (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused) {
    if (speechSynthesis.paused) speechSynthesis.resume()
    else speechSynthesis.pause()
    playbackUiTick.value++
  }
}

function restartBrowserUtteranceWithCurrentRate() {
  const ctx = lastBrowserCtx.value
  if (!ctx || readUseVoiceApi()) return

  browserUtterGen++
  const gen = browserUtterGen
  speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(ctx.text)
  utter.lang = 'en-US'
  utter.rate = clampSpeechRate(speechRate.value)
  const voice = pickEnVoice()
  if (voice) utter.voice = voice

  utter.onend = () => {
    if (gen !== browserUtterGen) return
    clearSpeakingState()
    playbackUiTick.value++
  }
  utter.onerror = utter.onend

  browserPlaybackActive.value = true
  speechSynthesis.speak(utter)
}

function resolveAudioUrl(base: string, audioUrl: string): string {
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) return audioUrl
  const path = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`
  return `${base}${path}`
}

async function speakTextThroughApi(text: string, sectionButton: HTMLButtonElement | null) {
  stopSpeech()

  if (!text) return

  if (sectionButton) {
    activeSectionButton = sectionButton
    setButtonToStop(sectionButton)
  } else {
    selectionPlaybackActive.value = true
  }

  const ac = new AbortController()
  fetchAbort = ac
  apiInFlight.value = true

  const base = readVoiceApiBase()
  const engine = readVoiceEngine()

  try {
    const fd = new FormData()
    fd.append('text', text)
    fd.append('engine', engine.trim().toLowerCase())

    const res = await fetch(`${base}/api/synthesize`, {
      method: 'POST',
      body: fd,
      signal: ac.signal
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      let msg = errBody || res.statusText
      try {
        const j = JSON.parse(errBody) as {
          detail?: string | Array<{ msg?: string } | string>
        }
        if (typeof j.detail === 'string') msg = j.detail
        else if (Array.isArray(j.detail)) {
          const parts = j.detail.map((d) =>
            typeof d === 'string' ? d : (d.msg ?? JSON.stringify(d))
          )
          if (parts.length) msg = parts.join('; ')
        }
      } catch {
        /* not JSON */
      }
      throw new Error(msg)
    }

    const data = (await res.json()) as { audio_url?: string }
    if (!data.audio_url) throw new Error('No audio_url in response')

    if (fetchAbort !== ac) return

    const url = resolveAudioUrl(base, data.audio_url)
    const audio = new Audio(url)
    audio.playbackRate = clampSpeechRate(speechRate.value)
    activeAudio = audio
    voiceApiPlaybackActive.value = true

    audio.addEventListener('play', () => {
      playbackUiTick.value++
    })
    audio.addEventListener('pause', () => {
      playbackUiTick.value++
    })

    const doneIfStillThisSession = () => {
      clearSpeakingState()
      playbackUiTick.value++
    }

    audio.onended = doneIfStillThisSession
    audio.onerror = () => {
      if (sectionButton && activeSectionButton === sectionButton) {
        sectionButton.title = 'Audio playback failed'
      }
      clearSpeakingState()
      playbackUiTick.value++
    }

    try {
      await audio.play()
    } catch (playErr: unknown) {
      throw new Error(
        playErr instanceof Error ? playErr.message : 'Audio could not start (autoplay blocked?)'
      )
    }
  } catch (e: unknown) {
    if ((e as Error).name === 'AbortError') {
      clearSpeakingState()
      return
    }
    console.warn('[read-aloud] voice API failed:', e)
    const msg = (e as Error).message ?? String(e)
    if (sectionButton && activeSectionButton === sectionButton) {
      sectionButton.title = `Voice API error: ${msg}`
      clearSpeakingState()
    } else if (!sectionButton) {
      clearSpeakingState()
    }
  } finally {
    if (fetchAbort === ac) fetchAbort = null
    apiInFlight.value = false
  }
}

function speakTextBrowser(text: string, sectionButton: HTMLButtonElement | null) {
  stopSpeech()

  if (!text) return

  const gen = ++browserUtterGen
  lastBrowserCtx.value = { text, sectionButton }
  browserPlaybackActive.value = true

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = clampSpeechRate(speechRate.value)
  const voice = pickEnVoice()
  if (voice) utter.voice = voice

  if (sectionButton) {
    activeSectionButton = sectionButton
    setButtonToStop(sectionButton)
  } else {
    selectionPlaybackActive.value = true
  }

  utter.onend = () => {
    if (gen !== browserUtterGen) return
    clearSpeakingState()
    playbackUiTick.value++
  }
  utter.onerror = utter.onend

  speechSynthesis.speak(utter)
}

/** `sectionButton` null = selection listen (floating UI). */
function speakPlainText(raw: string, sectionButton: HTMLButtonElement | null) {
  const text = cleanSpeechText(raw).slice(0, MAX_SYNTH_CHARS).trim()
  if (!text) return

  if (readUseVoiceApi()) {
    void speakTextThroughApi(text, sectionButton)
    return
  }
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => speakTextBrowser(text, sectionButton), {
      once: true
    })
    return
  }
  speakTextBrowser(text, sectionButton)
}

function speakSection(heading: HTMLElement, button: HTMLButtonElement) {
  speakPlainText(sectionPlainText(heading), button)
}

function onSelectionFabClick() {
  if (selectionPlaybackActive.value && isSpeakingOrQueued()) {
    stopSpeech()
    return
  }
  const t = getSelectionSpeechText().slice(0, MAX_SYNTH_CHARS).trim()
  if (!t) return
  speakPlainText(t, null)
}

function triggerSelectionShortcut() {
  if (selectionPlaybackActive.value && isSpeakingOrQueued()) {
    stopSpeech()
    return
  }
  const t = getSelectionSpeechText().slice(0, MAX_SYNTH_CHARS).trim()
  if (!t) return
  speakPlainText(t, null)
}

function detachAll(doc: HTMLElement) {
  doc.querySelectorAll(`.${BTN_CLASS}`).forEach((b) => b.remove())
  doc.querySelectorAll(`.${HEADING_CLASS}`).forEach((h) => {
    h.classList.remove(HEADING_CLASS)
    ;(h as HTMLElement).style.removeProperty('position')
    ;(h as HTMLElement).style.removeProperty('padding-inline-end')
  })
}

function attachButtons() {
  if (!inBrowser) return
  const doc = getDocRoot()
  if (!doc) return

  detachAll(doc)

  const headings = doc.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
  headings.forEach((h) => {
    h.classList.add(HEADING_CLASS)
    h.style.position = 'relative'
    h.style.paddingInlineEnd = '5.75rem'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = BTN_CLASS
    btn.textContent = LABEL_LISTEN
    btn.setAttribute('aria-label', ARIA_LISTEN)
    btn.setAttribute('aria-pressed', 'false')
    btn.title = TITLE_LISTEN

    btn.addEventListener('click', (e) => {
      e.preventDefault()
      if (activeSectionButton === btn && isSpeakingOrQueued()) {
        stopSpeech()
        return
      }
      speakSection(h, btn)
    })

    h.appendChild(btn)
  })
}

function wire() {
  if (!inBrowser) return
  nextTick(() => attachButtons())
}

onContentUpdated(() => {
  wire()
})

watch(
  () => route.path,
  () => {
    stopSpeech()
    hasSelectableText.value = false
  }
)

function onGlobalKeydown(ev: KeyboardEvent) {
  if (!inBrowser) return

  const mod = ev.metaKey || ev.ctrlKey

  if (ev.key === 'Escape') {
    if (!isSpeakingOrQueued() && !activeSectionButton && !selectionPlaybackActive.value) return
    stopSpeech()
    return
  }

  if (mod && !ev.shiftKey && !ev.altKey && (ev.key === 'b' || ev.key === 'B')) {
    if (ev.repeat) return
    if (!sidebar.hasSidebar.value) return
    ev.preventDefault()
    sidebar.toggle()
    return
  }

  if (mod && ev.shiftKey && (ev.key === 'l' || ev.key === 'L')) {
    if (ev.repeat) return
    ev.preventDefault()
    triggerSelectionShortcut()
    return
  }

  if (!isSpeakingOrQueued()) return

  if (mod && ev.key === 'Enter') {
    ev.preventDefault()
    stopSpeech()
    return
  }

  if (
    activeAudio &&
    !activeAudio.ended &&
    !mod &&
    !ev.shiftKey &&
    !ev.altKey &&
    (ev.key === 'h' || ev.key === 'l')
  ) {
    if (isEditableKeyboardTarget(ev)) return
    ev.preventDefault()
    if (ev.key === 'h') {
      activeAudio.currentTime = Math.max(0, activeAudio.currentTime - 5)
    } else {
      const dur = activeAudio.duration
      if (Number.isFinite(dur)) {
        activeAudio.currentTime = Math.min(dur, activeAudio.currentTime + 5)
      } else {
        activeAudio.currentTime = activeAudio.currentTime + 5
      }
    }
    playbackUiTick.value++
    return
  }

  if (ev.shiftKey && !mod && !ev.altKey) {
    let delta = 0
    if (ev.key === '>') delta = RATE_STEP
    else if (ev.key === '<') delta = -RATE_STEP
    else if (ev.code === 'Period') delta = RATE_STEP
    else if (ev.code === 'Comma') delta = -RATE_STEP
    if (delta !== 0) {
      ev.preventDefault()
      bumpSpeechRate(delta)
      return
    }
  }

  if (ev.key === 'Enter' && !mod && !ev.shiftKey && !ev.altKey) {
    if (isEditableKeyboardTarget(ev)) return
    ev.preventDefault()
    togglePauseResume()
  }
}

onMounted(() => {
  mounted.value = true
  syncPrefsFromStorage()
  if (!inBrowser) return
  selectionShortcutLabel.value = /Mac|iPhone|iPod/i.test(navigator.userAgent)
    ? '⌘⇧L'
    : 'Ctrl+Shift+L'
  modKeyLabel.value = /Mac|iPhone|iPod/i.test(navigator.userAgent) ? '⌘' : 'Ctrl+'
  window.addEventListener('keydown', onGlobalKeydown)
  document.addEventListener('selectionchange', scheduleSelectionUiUpdate)
})

onUnmounted(() => {
  clearTimeout(selectionDebounce)
  clearTimeout(rateRestartTimer)
  if (inBrowser) {
    window.removeEventListener('keydown', onGlobalKeydown)
    document.removeEventListener('selectionchange', scheduleSelectionUiUpdate)
  }
  stopSpeech()
})
</script>

<template>
  <div v-if="mounted" class="read-aloud-prefs">
    <button
      type="button"
      class="read-aloud-prefs__toggle"
      :aria-expanded="prefsOpen"
      aria-controls="read-aloud-prefs-panel"
      @click="prefsOpen = !prefsOpen"
    >
      Read-aloud
    </button>
    <div
      v-show="prefsOpen"
      id="read-aloud-prefs-panel"
      class="read-aloud-prefs__panel"
      role="region"
      aria-label="Read aloud voice settings"
    >
      <label class="read-aloud-prefs__row">
        <input v-model="useVoiceApi" type="checkbox" />
        <span>Use local voice API (voice-playground)</span>
      </label>
      <p class="read-aloud-prefs__hint">
        When enabled, section audio is generated via
        <code>POST /api/synthesize</code>
        on your server (default {{ DEFAULT_VOICE_API_BASE }}). Stored in this browser only.
      </p>
      <p class="read-aloud-prefs__hint read-aloud-prefs__hint--kbd">
        <strong>Selection:</strong> select text in the article, then use the floating button or
        <kbd>{{ selectionShortcutLabel }}</kbd> to listen or stop.
      </p>
      <p class="read-aloud-prefs__hint read-aloud-prefs__hint--kbd">
        <strong>Keys:</strong> <kbd>{{ modKeyLabel }}B</kbd> toggle sidebar · while audio or speech is
        active: <kbd>Enter</kbd> pause/resume (not in inputs), <kbd>{{ modKeyLabel }}Enter</kbd> stop,
        <kbd>Shift</kbd>+<kbd>&lt;</kbd> / <kbd>Shift</kbd>+<kbd>&gt;</kbd> slower / faster (same as
        <kbd>Shift</kbd>+<kbd>,</kbd> / <kbd>Shift</kbd>+<kbd>.</kbd> on US keyboards). During
        <strong>voice API</strong> playback only: plain <kbd>h</kbd> / <kbd>l</kbd> (lowercase, no
        modifiers) skip back / forward 5s — not <kbd>H</kbd>/<kbd>L</kbd> (e.g. Caps Lock).
      </p>
      <div class="read-aloud-prefs__rate">
        <label class="read-aloud-prefs__label" for="read-aloud-rate">Speaking speed</label>
        <div class="read-aloud-prefs__rate-row">
          <button
            type="button"
            class="read-aloud-prefs__rate-btn"
            aria-label="Slower"
            :disabled="speechRate <= RATE_MIN + 0.001"
            @click="bumpSpeechRate(-RATE_STEP)"
          >
            Slower
          </button>
          <input
            id="read-aloud-rate"
            v-model.number="speechRate"
            class="read-aloud-prefs__rate-slider"
            type="range"
            :min="RATE_MIN"
            :max="RATE_MAX"
            :step="RATE_STEP"
          />
          <button
            type="button"
            class="read-aloud-prefs__rate-btn"
            aria-label="Faster"
            :disabled="speechRate >= RATE_MAX - 0.001"
            @click="bumpSpeechRate(RATE_STEP)"
          >
            Faster
          </button>
        </div>
        <div class="read-aloud-prefs__rate-foot">
          <span class="read-aloud-prefs__rate-value">{{ speechRate.toFixed(1) }}×</span>
          <button
            v-if="Math.abs(speechRate - RATE_DEFAULT) > 0.001"
            type="button"
            class="read-aloud-prefs__rate-reset"
            @click="resetSpeechRate"
          >
            Reset to 1×
          </button>
        </div>
        <p class="read-aloud-prefs__hint read-aloud-prefs__hint--rate">
          Voice API: speed changes apply while audio plays. Browser: applies the next time you start Listen.
        </p>
      </div>
      <template v-if="useVoiceApi">
        <label class="read-aloud-prefs__label" for="read-aloud-base">API base URL</label>
        <input
          id="read-aloud-base"
          v-model="voiceApiBaseInput"
          class="read-aloud-prefs__input"
          type="url"
          autocomplete="url"
          placeholder="http://localhost:8321"
          @blur="persistVoiceApiBase"
          @change="persistVoiceApiBase"
        />
        <label class="read-aloud-prefs__label" for="read-aloud-engine">Engine</label>
        <select
          id="read-aloud-engine"
          v-model="voiceEngine"
          class="read-aloud-prefs__select"
        >
          <option value="piper">Piper (offline on server)</option>
          <option value="edge">Edge (Microsoft online)</option>
          <option value="chatterbox">Chatterbox (slow / GPU)</option>
        </select>
      </template>
    </div>
  </div>

  <div
    v-show="showPlaybackToolbar"
    class="read-aloud-playback-toolbar"
    role="toolbar"
    aria-label="Read aloud playback"
  >
    <button
      type="button"
      class="read-aloud-toolbar__btn read-aloud-toolbar__btn--primary"
      @click="togglePauseResume"
    >
      {{ playbackPaused ? 'Resume' : 'Pause' }}
    </button>
    <div class="read-aloud-toolbar__rate" aria-label="Speaking speed">
      <button
        type="button"
        class="read-aloud-toolbar__btn"
        aria-label="Slower"
        :disabled="speechRate <= RATE_MIN + 0.001"
        @click="bumpSpeechRate(-RATE_STEP)"
      >
        −
      </button>
      <span class="read-aloud-toolbar__rate-label">{{ speechRate.toFixed(1) }}×</span>
      <button
        type="button"
        class="read-aloud-toolbar__btn"
        aria-label="Faster"
        :disabled="speechRate >= RATE_MAX - 0.001"
        @click="bumpSpeechRate(RATE_STEP)"
      >
        +
      </button>
    </div>
    <button type="button" class="read-aloud-toolbar__btn" @click="stopSpeech">Stop</button>
  </div>

  <button
    v-show="showSelectionFab"
    type="button"
    class="read-aloud-selection-fab"
    :aria-label="selectionPlaybackActive && isSpeakingOrQueued() ? ARIA_STOP : ARIA_SELECTION_LISTEN"
    :aria-pressed="selectionPlaybackActive && isSpeakingOrQueued() ? 'true' : 'false'"
    :title="selectionPlaybackActive && isSpeakingOrQueued() ? TITLE_STOP : TITLE_SELECTION_LISTEN"
    @click="onSelectionFabClick"
  >
    {{ selectionPlaybackActive && isSpeakingOrQueued() ? LABEL_STOP : LABEL_SELECTION_LISTEN }}
  </button>
</template>

<style scoped>
.read-aloud-prefs {
  position: fixed;
  z-index: 2147483646;
  bottom: 12px;
  left: 12px;
  max-width: min(360px, calc(100vw - 24px));
  font-size: 13px;
}

.read-aloud-prefs__toggle {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-weight: 500;
  box-shadow: var(--vp-shadow-2);
}

.read-aloud-prefs__toggle:hover {
  border-color: var(--vp-c-brand-1);
}

.read-aloud-prefs__panel {
  margin-top: 8px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-2);
}

.read-aloud-prefs__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.read-aloud-prefs__row input {
  margin-top: 3px;
}

.read-aloud-prefs__hint {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.45;
}

.read-aloud-prefs__hint--rate {
  margin-top: 6px;
}

.read-aloud-prefs__rate {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--vp-c-divider);
}

.read-aloud-prefs__rate-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.read-aloud-prefs__rate-btn {
  flex: 0 0 auto;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.read-aloud-prefs__rate-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
}

.read-aloud-prefs__rate-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.read-aloud-prefs__rate-slider {
  flex: 1 1 auto;
  min-width: 0;
  accent-color: var(--vp-c-brand-1);
}

.read-aloud-prefs__rate-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.read-aloud-prefs__rate-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.read-aloud-prefs__rate-reset {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  text-decoration: underline;
}

.read-aloud-prefs__rate-reset:hover {
  color: var(--vp-c-brand-2);
}

.read-aloud-prefs__hint--kbd kbd {
  display: inline-block;
  padding: 1px 5px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
}

.read-aloud-prefs__label {
  display: block;
  margin-top: 10px;
  margin-bottom: 4px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.read-aloud-prefs__input,
.read-aloud-prefs__select {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.read-aloud-playback-toolbar {
  position: fixed;
  z-index: 2147483645;
  bottom: 112px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-3);
  max-width: calc(100vw - 24px);
}

.read-aloud-toolbar__btn {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.read-aloud-toolbar__btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft-up);
}

.read-aloud-toolbar__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.read-aloud-toolbar__btn--primary {
  min-width: 5.5rem;
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.read-aloud-toolbar__rate {
  display: flex;
  align-items: center;
  gap: 6px;
}

.read-aloud-toolbar__rate-label {
  min-width: 2.75rem;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}

.read-aloud-selection-fab {
  position: fixed;
  z-index: 2147483645;
  bottom: 56px;
  right: 12px;
  max-width: min(220px, calc(100vw - 24px));
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--vp-shadow-3);
}

.read-aloud-selection-fab:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft-up);
}

.read-aloud-selection-fab[aria-pressed='true'] {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-2);
}
</style>

<style>
.vp-heading-with-read-aloud .read-aloud-section-btn {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
  font-size: 12px;
  line-height: 1.2;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.vp-heading-with-read-aloud .read-aloud-section-btn:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft-up);
}

.vp-heading-with-read-aloud .read-aloud-section-btn.is-speaking {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .vp-heading-with-read-aloud {
    padding-inline-end: 0 !important;
    padding-top: 2rem;
  }

  .vp-heading-with-read-aloud .read-aloud-section-btn {
    top: 0;
    right: 0;
  }
}
</style>
