/**
 * useLiveDetection — drives the real-time camera capture → analyze loop.
 *
 * Strategy:
 *   - Every CAPTURE_INTERVAL_MS, grab a JPEG frame and send it to /analyze.
 *   - A positive hit is any result whose type is known (not 'unknown') and whose
 *     confidence is ≥ CONFIDENCE_THRESHOLD.
 *   - After a positive hit a COOLDOWN_MS pause prevents the same subject from
 *     being re-sent immediately, then scanning resumes automatically.
 *   - Each new detection is prepended to `history` — old results are kept.
 *   - An in-flight guard (isAnalyzing) prevents concurrent requests.
 */
import type { AnalysisResponse } from '~/types/analysis'

const CAPTURE_INTERVAL_MS = 750
const COOLDOWN_MS = 4_000
const CONFIDENCE_THRESHOLD = 0.5

export type LiveStatus = 'idle' | 'scanning' | 'analyzing' | 'detected'

export interface HistoryEntry {
  result: AnalysisResponse
  thumbnail: string   // base64 data URL, captured from <video> at detection time
  id: string          // sequential display ID: V001, V002…
}

export function useLiveDetection(
  videoEl: Ref<HTMLVideoElement | null>,
  canvasEl: Ref<HTMLCanvasElement | null>,
) {
  const { cameraActive, cameraError, startCamera, stopCamera, captureFrame } = useCamera()
  const { loading: analyzing, result: rawResult, error: analyzeError, analyze, reset } = useAnalyze()

  const isRunning = ref(false)
  const status = ref<LiveStatus>('idle')
  const history = ref<HistoryEntry[]>([])   // newest first
  const confidence = ref<number | null>(null)
  let entryCounter = 0

  // Non-reactive guards (no overhead in the hot loop)
  let isAnalyzing = false
  let isCooldown = false
  let intervalId: ReturnType<typeof setInterval> | null = null
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null

  // ── Detection loop ────────────────────────────────────────────────────────

  async function runFrame() {
    if (isAnalyzing || isCooldown) return
    if (!videoEl.value || !canvasEl.value) return
    // Skip if video hasn't actually loaded any frames yet
    if (videoEl.value.readyState < 2) return

    isAnalyzing = true
    status.value = 'analyzing'

    try {
      // Capture thumbnail FIRST (same frame that will be sent to the API)
      let pendingThumbnail = ''
      const vd = videoEl.value
      if (vd && vd.videoWidth > 0) {
        const tc = document.createElement('canvas')
        tc.width = 240
        tc.height = Math.round(240 * vd.videoHeight / vd.videoWidth)
        tc.getContext('2d')?.drawImage(vd, 0, 0, tc.width, tc.height)
        pendingThumbnail = tc.toDataURL('image/jpeg', 0.7)
      }

      const frame = await captureFrame(videoEl.value, canvasEl.value, 0.75)
      await analyze([frame])

      if (rawResult.value) {
        const hits = rawResult.value.results.filter(
          (r) => r.type !== 'unknown' && (r.confidence ?? 0) >= CONFIDENCE_THRESHOLD,
        )

        if (hits.length > 0) {
          const thumbnail = pendingThumbnail

          entryCounter++
          const id = `V${String(entryCounter).padStart(3, '0')}`
          history.value = [{ result: rawResult.value as AnalysisResponse, thumbnail, id }, ...history.value]
          confidence.value = hits[0]?.confidence ?? null
          status.value = 'detected'

          // Cooldown — pause before scanning the next subject
          isCooldown = true
          cooldownTimer = setTimeout(() => {
            isCooldown = false
            if (isRunning.value) status.value = 'scanning'
          }, COOLDOWN_MS)
        } else {
          status.value = 'scanning'
        }
      } else {
        status.value = 'scanning'
      }
    } catch {
      status.value = 'scanning'
    } finally {
      isAnalyzing = false
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async function startLive() {
    if (!videoEl.value) return

    isAnalyzing = false
    isCooldown = false
    isRunning.value = true
    status.value = 'scanning'

    await startCamera(videoEl.value, canvasEl.value ?? undefined)

    if (cameraError.value) {
      isRunning.value = false
      status.value = 'idle'
      return
    }

    intervalId = setInterval(runFrame, CAPTURE_INTERVAL_MS)
  }

  function stopLive() {
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    if (cooldownTimer) { clearTimeout(cooldownTimer); cooldownTimer = null }
    stopCamera()
    isRunning.value = false
    isAnalyzing = false
    isCooldown = false
    status.value = 'idle'
  }

  function clearHistory() {
    history.value = []
    confidence.value = null
    entryCounter = 0
    reset()
  }

  function removeEntry(id: string) {
    history.value = history.value.filter((e) => e.id !== id)
  }

  onUnmounted(stopLive)

  return {
    // State
    isRunning: readonly(isRunning),
    status: readonly(status),
    history: readonly(history) as Readonly<Ref<HistoryEntry[]>>,
    confidence: readonly(confidence),
    analyzing,
    error: analyzeError,
    cameraError,
    cameraActive,
    // Actions
    startLive,
    stopLive,
    clearHistory,
    removeEntry,
  }
}
