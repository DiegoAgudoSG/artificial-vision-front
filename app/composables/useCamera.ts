/**
 * useCamera — encapsulates all MediaDevices / camera logic.
 *
 * Exposed API:
 *   startCamera(videoEl, canvasEl)   – request stream, attach to <video>
 *   stopCamera()                     – stop all tracks, detach stream
 *   captureFrame(videoEl, canvasEl)  – draw frame → return JPEG File
 *   toggleFacingMode()               – flip front ↔ back, restart stream
 *   setZoom(value)                   – apply zoom via advanced constraints
 *   toggleTorch()                    – flip torch/flash on back camera
 *   hasMultipleCameras               – whether front/back toggle is useful
 *   cameraActive, cameraError        – state refs
 *   facingMode, zoomLevel, zoomMin, zoomMax, zoomSupported, torchOn, torchSupported
 */

// Extended MediaTrackCapabilities / MediaTrackConstraintSet are not yet in
// the standard TS lib — augment them locally so we keep strict types.
interface ExtendedCapabilities extends MediaTrackCapabilities {
  zoom?: { min: number; max: number; step: number }
  torch?: boolean
}
interface ExtendedConstraintSet extends MediaTrackConstraintSet {
  zoom?: number
  torch?: boolean
}

export function useCamera() {
  // ── State ──────────────────────────────────────────────────────────────────
  const cameraActive = ref(false)
  const cameraError = ref<string | null>(null)
  const facingMode = ref<'environment' | 'user'>('environment')

  // Zoom
  const zoomLevel = ref(1)
  const zoomMin = ref(1)
  const zoomMax = ref(1)
  const zoomSupported = ref(false)

  // Torch
  const torchOn = ref(false)
  const torchSupported = ref(false)

  // Multiple cameras
  const hasMultipleCameras = ref(false)

  // Raw stream – not reactive (no Vue overhead for MediaStream)
  let stream: MediaStream | null = null

  // Enumerated video devices (populated after permission is granted)
  let videoDevices: MediaDeviceInfo[] = []
  let currentDeviceId: string | null = null

  // Keep element refs so visibility handler can restart without component involvement
  let _videoEl: HTMLVideoElement | null = null
  let _canvasEl: HTMLCanvasElement | undefined = undefined

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function detectMultipleCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      videoDevices = devices.filter((d) => d.kind === 'videoinput')
      hasMultipleCameras.value = videoDevices.length > 1
      // Record which device is currently active so we can cycle by ID
      if (stream) {
        currentDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId ?? null
      }
    } catch {
      hasMultipleCameras.value = false
    }
  }

  function detectCapabilities() {
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return

    const caps = track.getCapabilities() as ExtendedCapabilities

    // Zoom
    if (caps.zoom) {
      zoomMin.value = caps.zoom.min
      zoomMax.value = caps.zoom.max
      zoomLevel.value = caps.zoom.min
      zoomSupported.value = true
    } else {
      zoomSupported.value = false
    }

    // Torch (only available on back camera in most browsers)
    torchSupported.value = Boolean(caps.torch)
    if (!torchSupported.value) torchOn.value = false
  }

  // ── Core ───────────────────────────────────────────────────────────────────
  async function startCamera(
    videoEl: HTMLVideoElement,
    canvasEl?: HTMLCanvasElement,
  ) {
    cameraError.value = null

    // Remember elements for auto-restart on visibility change
    _videoEl = videoEl
    _canvasEl = canvasEl

    // Stop any existing stream first
    _stopTracks()

    try {
      const videoConstraints: MediaTrackConstraints = currentDeviceId
        ? { deviceId: { exact: currentDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: { ideal: facingMode.value }, width: { ideal: 1920 }, height: { ideal: 1080 } }

      stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })

      videoEl.srcObject = stream
      await videoEl.play().catch(() => {
        // autoplay may be blocked on some browsers; playsinline handles it
      })

      cameraActive.value = true
      // Detect after permission is granted — browsers expose full device list only then
      await detectMultipleCameras()
      detectCapabilities()
    } catch (err: unknown) {
      cameraActive.value = false
      const name = err instanceof Error ? err.name : ''
      const msg = err instanceof Error ? err.message : String(err)

      if (name === 'NotAllowedError' || msg.toLowerCase().includes('permission')) {
        cameraError.value =
          'Camera access was denied. Allow camera permission in your browser settings.'
      } else if (
        name === 'NotFoundError' ||
        msg.toLowerCase().includes('notfound') ||
        msg.toLowerCase().includes('devicesnotfound')
      ) {
        cameraError.value = 'No camera device found on this device.'
      } else if (name === 'NotReadableError') {
        cameraError.value =
          'Camera is already in use by another application.'
      } else {
        cameraError.value = msg || 'Unknown camera error.'
      }
    }
  }

  function stopCamera() {
    _stopTracks()
    cameraActive.value = false
    torchOn.value = false
  }

  function _stopTracks() {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
  }

  async function toggleFacingMode(
    videoEl: HTMLVideoElement,
    canvasEl?: HTMLCanvasElement,
  ) {
    // Reset capabilities while switching
    zoomSupported.value = false
    torchSupported.value = false
    torchOn.value = false

    if (videoDevices.length > 1 && currentDeviceId) {
      // Desktop & multi-camera: cycle to the next device by deviceId.
      // facingMode is unreliable on desktop (all cameras report 'unknown').
      const idx = videoDevices.findIndex((d) => d.deviceId === currentDeviceId)
      const next = videoDevices[(idx + 1) % videoDevices.length]
      currentDeviceId = next.deviceId
    } else {
      // Fallback for first toggle before deviceId is known: flip facingMode
      facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
      currentDeviceId = null // let getUserMedia pick via facingMode
    }

    await startCamera(videoEl, canvasEl)
  }

  async function setZoom(value: number) {
    if (!stream || !zoomSupported.value) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({
        advanced: [{ zoom: value } as ExtendedConstraintSet],
      })
      zoomLevel.value = value
    } catch {
      // Silently ignore — device may not support runtime zoom change
    }
  }

  async function toggleTorch() {
    if (!stream || !torchSupported.value) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn.value
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as ExtendedConstraintSet],
      })
      torchOn.value = next
    } catch {
      // Device rejected torch change
    }
  }

  // ── Capture ────────────────────────────────────────────────────────────────
  function captureFrame(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    quality = 0.92,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      canvasEl.width = videoEl.videoWidth
      canvasEl.height = videoEl.videoHeight
      const ctx = canvasEl.getContext('2d')
      if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
      ctx.drawImage(videoEl, 0, 0)
      canvasEl.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to capture frame'))
          resolve(
            new File([blob], `capture-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            }),
          )
        },
        'image/jpeg',
        quality,
      )
    })
  }

  // True when a front/back flip is worth offering:
  // - detected ≥2 cameras (post-permission), OR
  // - touch device (phones/tablets always have both)
  const canFlipCamera = computed(
    () =>
      hasMultipleCameras.value ||
      (typeof window !== 'undefined' && 'ontouchstart' in window),
  )

  // ── Visibility / app-resume handling ──────────────────────────────────────
  // Mobile browsers kill the camera track when the user switches apps.
  // We restart automatically when the page becomes visible again.
  async function _onVisibilityChange() {
    if (typeof document === 'undefined') return
    if (!document.hidden && cameraActive.value && _videoEl) {
      // Give the browser a tick to fully restore the foreground context
      await nextTick()
      await startCamera(_videoEl, _canvasEl)
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', _onVisibilityChange)
    }
  })

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', _onVisibilityChange)
    }
    stopCamera()
  })

  return {
    // State
    cameraActive,
    cameraError,
    facingMode,
    zoomLevel,
    zoomMin,
    zoomMax,
    zoomSupported,
    torchOn,
    torchSupported,
    hasMultipleCameras,
    canFlipCamera,
    // Actions
    startCamera,
    stopCamera,
    toggleFacingMode,
    setZoom,
    toggleTorch,
    captureFrame,
  }
}
