<script setup lang="ts">
/**
 * Per-heading Listen: browser Speech Synthesis, or optional local voice-playground
 * POST /api/synthesize + GET /api/audio/*. Preference stored in localStorage.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { inBrowser, onContentUpdated, useRoute } from 'vitepress'

const route = useRoute()

const LS_USE_VOICE_API = 'prep-read-aloud-use-voice-api'
const LS_VOICE_API_BASE = 'prep-read-aloud-voice-api-base'
const LS_VOICE_ENGINE = 'prep-read-aloud-voice-engine'

const DEFAULT_VOICE_API_BASE = 'http://localhost:8321'
const MAX_SYNTH_CHARS = 5000

const BTN_CLASS = 'read-aloud-section-btn'
const HEADING_CLASS = 'vp-heading-with-read-aloud'

const LABEL_LISTEN = 'Listen'
const LABEL_STOP = 'Stop'
const ARIA_LISTEN =
  'Read this section aloud, from this heading until the next section heading'
const ARIA_STOP = 'Stop reading aloud'
const TITLE_LISTEN = 'Read this section aloud (skips code blocks)'
const TITLE_STOP = 'Stop speech (Escape also stops)'

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

const mounted = ref(false)
const prefsOpen = ref(false)

const useVoiceApi = computed({
  get: () => readUseVoiceApi(),
  set: (v: boolean) => {
    writeUseVoiceApi(v)
  }
})

const voiceApiBaseInput = ref(DEFAULT_VOICE_API_BASE)
const voiceEngine = ref('piper')

function syncPrefsFromStorage() {
  voiceApiBaseInput.value = readVoiceApiBase()
  voiceEngine.value = readVoiceEngine()
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

function pickEnVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'en-US' && v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0] ??
    null
  )
}

let activeButton: HTMLButtonElement | null = null
let activeAudio: HTMLAudioElement | null = null
let fetchAbort: AbortController | null = null
const apiInFlight = ref(false)

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
  if (activeButton) resetButtonToListen(activeButton)
  activeButton = null
}

function stopSpeech() {
  speechSynthesis.cancel()
  fetchAbort?.abort()
  fetchAbort = null
  apiInFlight.value = false
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.removeAttribute('src')
    activeAudio.load()
    activeAudio = null
  }
  clearSpeakingState()
}

function isSpeakingOrQueued(): boolean {
  if (apiInFlight.value) return true
  if (activeAudio && !activeAudio.paused && !activeAudio.ended) return true
  return speechSynthesis.speaking || speechSynthesis.pending
}

function resolveAudioUrl(base: string, audioUrl: string): string {
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) return audioUrl
  const path = audioUrl.startsWith('/') ? audioUrl : `/${audioUrl}`
  return `${base}${path}`
}

async function speakSectionViaApi(
  heading: HTMLElement,
  button: HTMLButtonElement,
  base: string,
  engine: string
) {
  stopSpeech()

  const raw = sectionPlainText(heading)
  const text = raw.slice(0, MAX_SYNTH_CHARS).trim()
  if (!text) return

  activeButton = button
  setButtonToStop(button)

  const ac = new AbortController()
  fetchAbort = ac
  apiInFlight.value = true

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
    activeAudio = audio

    audio.onended = () => {
      activeAudio = null
      if (activeButton === button) clearSpeakingState()
    }
    audio.onerror = () => {
      activeAudio = null
      if (activeButton === button) {
        button.title = 'Audio playback failed'
        clearSpeakingState()
      }
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
    if (activeButton === button) {
      button.title = `Voice API error: ${(e as Error).message ?? String(e)}`
      clearSpeakingState()
    }
  } finally {
    if (fetchAbort === ac) fetchAbort = null
    apiInFlight.value = false
  }
}

function speakSectionBrowser(heading: HTMLElement, button: HTMLButtonElement) {
  stopSpeech()

  const text = sectionPlainText(heading)
  if (!text) return

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  const voice = pickEnVoice()
  if (voice) utter.voice = voice

  activeButton = button
  setButtonToStop(button)

  utter.onend = () => {
    if (activeButton === button) clearSpeakingState()
  }
  utter.onerror = () => {
    if (activeButton === button) clearSpeakingState()
  }

  speechSynthesis.speak(utter)
}

function speakSection(heading: HTMLElement, button: HTMLButtonElement) {
  if (readUseVoiceApi()) {
    const base = readVoiceApiBase()
    const engine = readVoiceEngine()
    void speakSectionViaApi(heading, button, base, engine)
    return
  }

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => speakSectionBrowser(heading, button), {
      once: true
    })
    return
  }
  speakSectionBrowser(heading, button)
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
  const doc = document.querySelector('main .vp-doc') as HTMLElement | null
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
      if (activeButton === btn && isSpeakingOrQueued()) {
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
  }
)

function onEscapeKey(ev: KeyboardEvent) {
  if (ev.key !== 'Escape') return
  if (!isSpeakingOrQueued() && !activeButton) return
  stopSpeech()
}

onMounted(() => {
  mounted.value = true
  syncPrefsFromStorage()
  if (!inBrowser) return
  window.addEventListener('keydown', onEscapeKey)
})

onUnmounted(() => {
  if (inBrowser) window.removeEventListener('keydown', onEscapeKey)
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

.read-aloud-prefs__hint code {
  font-size: 11px;
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
