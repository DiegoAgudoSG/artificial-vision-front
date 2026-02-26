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

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function detectMultipleCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      hasMultipleCameras.value =
        devices.filter((d) => d.kind === 'videoinput').length > 1
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

    // Stop any existing stream first
    _stopTracks()

    try {
      await detectMultipleCameras()

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode.value },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      videoEl.srcObject = stream
      await videoEl.play().catch(() => {
        // autoplay may be blocked on some browsers; playsinline handles it
      })

      cameraActive.value = true
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
    facingMode.value =
      facingMode.value === 'environment' ? 'user' : 'environment'
    // Reset capabilities while switching
    zoomSupported.value = false
    torchSupported.value = false
    torchOn.value = false
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

  // ── Cleanup ────────────────────────────────────────────────────────────────
  onUnmounted(() => stopCamera())

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
    // Actions
    startCamera,
    stopCamera,
    toggleFacingMode,
    setZoom,
    toggleTorch,
    captureFrame,
  }
}
