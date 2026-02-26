<template>
  <div class="space-y-5">

    <!-- ── Camera viewport ─────────────────────────────────────────────────── -->
    <div class="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video">

      <!-- Live video feed -->
      <video
        ref="videoEl"
        autoplay
        muted
        playsinline
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="cameraActive ? 'opacity-100' : 'opacity-0'"
      />

      <!-- Bounding-box / detection overlay -->
      <canvas
        ref="canvasEl"
        class="absolute inset-0 w-full h-full pointer-events-none"
      />

      <!-- Idle placeholder (camera not yet started) -->
      <div
        v-if="!isRunning && !cameraActive"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-700"
      >
        <svg class="w-14 h-14" fill="none" stroke="currentColor" stroke-width="1.1" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <p class="text-sm font-medium">Camera inactive — press Start to begin</p>
      </div>

      <!-- Status badge (top-right corner) -->
      <div class="absolute top-3 right-3">
        <span
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur border"
          :class="statusBadgeClasses"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="[statusDotColor, isRunning && status !== 'detected' ? 'animate-pulse' : '']"
          />
          {{ STATUS_LABELS[status] }}
        </span>
      </div>

      <!-- Camera permission / hardware error -->
      <Transition name="fade">
        <div
          v-if="cameraError"
          class="absolute inset-0 flex items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-sm"
        >
          <div class="text-center space-y-2">
            <p class="text-sm font-semibold text-red-400">Camera error</p>
            <p class="text-xs text-red-400/70 leading-relaxed max-w-xs">{{ cameraError }}</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Confidence meter ────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="confidence !== null" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Last detection confidence</span>
          <span class="text-xs font-mono" :class="confidenceColor">{{ (confidence * 100).toFixed(0) }}%</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="confidenceBarColor"
            :style="{ width: `${(confidence * 100).toFixed(1)}%` }"
          />
        </div>
      </div>
    </Transition>

    <!-- ── Start / Stop button ────────────────────────────────────────────── -->
    <button
      type="button"
      class="w-full rounded-2xl px-6 py-4 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      :class="isRunning
        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
        : 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-800/40'"
      @click="isRunning ? stopLive() : startLive()"
    >
      <span v-if="isRunning" class="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      {{ isRunning ? 'Stop Detection' : 'Start Live Detection' }}
    </button>

    <!-- ── Live result panel (history stack) ────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="analyzing || history.length || error"
        class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6 space-y-5"
      >
        <!-- Panel header -->
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">2</span>
          <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Detections</h2>
          <span v-if="history.length" class="text-[10px] text-zinc-500 font-mono">({{ history.length }})</span>
          <button
            v-if="history.length"
            type="button"
            class="ml-auto text-[10px] font-medium text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 rounded-full transition-colors"
            @click="clearHistory()"
          >Clear all</button>
        </div>

        <!-- Analyzing inline spinner -->
        <div v-if="analyzing" class="flex items-center gap-3 py-1">
          <span class="w-4 h-4 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin shrink-0" />
          <span class="text-xs text-zinc-500">Analyzing frame…</span>
        </div>

        <!-- Error -->
        <div
          v-if="!analyzing && error"
          class="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-400"
        >{{ error }}</div>

        <!-- History: newest first -->
        <TransitionGroup name="slide" tag="div" class="space-y-5">
          <div v-for="(item, idx) in history" :key="item.meta.batch_id + idx">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                {{ formatTs(item.meta.processed_at) }}
              </span>
              <span v-if="idx === 0" class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Latest</span>
            </div>
            <ResultViewer :result="item" :loading="false" :error="null" />
            <div v-if="idx < history.length - 1" class="mt-5 border-t border-zinc-800" />
          </div>
        </TransitionGroup>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { VehicleImageResult } from '~/types/analysis'
import { isVehicleResult } from '~/types/analysis'
import type { LiveStatus } from '~/composables/useLiveDetection'

// ── Refs passed to the composable ────────────────────────────────────────────

const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const {
  isRunning,
  status,
  history,
  confidence,
  analyzing,
  error,
  cameraError,
  cameraActive,
  startLive,
  stopLive,
  clearHistory,
} = useLiveDetection(videoEl, canvasEl)

// ── Timestamp formatter ───────────────────────────────────────────────────

function formatTs(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', { timeStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ── Status badge styling ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<LiveStatus, string> = {
  idle: 'Idle',
  scanning: 'Scanning…',
  analyzing: 'Analyzing…',
  detected: 'Detected!',
}

const statusBadgeClasses = computed(() => {
  switch (status.value) {
    case 'scanning':   return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
    case 'analyzing':  return 'bg-violet-500/10 border-violet-500/30 text-violet-300'
    case 'detected':   return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    default:           return 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
  }
})

const statusDotColor = computed(() => {
  switch (status.value) {
    case 'scanning':   return 'bg-blue-400'
    case 'analyzing':  return 'bg-violet-400'
    case 'detected':   return 'bg-emerald-400'
    default:           return 'bg-zinc-500'
  }
})

// ── Confidence bar helpers ────────────────────────────────────────────────────

const confidenceColor = computed(() => {
  if (confidence.value === null) return 'text-zinc-500'
  if (confidence.value >= 0.8) return 'text-emerald-400'
  if (confidence.value >= 0.6) return 'text-amber-400'
  return 'text-orange-400'
})

const confidenceBarColor = computed(() => {
  if (confidence.value === null) return 'bg-zinc-600'
  if (confidence.value >= 0.8) return 'bg-emerald-500'
  if (confidence.value >= 0.6) return 'bg-amber-500'
  return 'bg-orange-500'
})

// ── Canvas bounding-box overlay ──────────────────────────────────────────────
//
// Draws either the real bounding box (when API returns one) or a centered
// dashed placeholder rect to indicate the active detection zone.

function syncCanvasSize() {
  const cv = canvasEl.value
  const vd = videoEl.value
  if (!cv || !vd) return
  if (cv.width !== vd.clientWidth || cv.height !== vd.clientHeight) {
    cv.width = vd.clientWidth
    cv.height = vd.clientHeight
  }
}

function clearOverlay() {
  const cv = canvasEl.value
  if (!cv) return
  const ctx = cv.getContext('2d')
  ctx?.clearRect(0, 0, cv.width, cv.height)
}

function drawDetectionOverlay(result: AnalysisResponse | null) {
  const cv = canvasEl.value
  if (!cv) return
  syncCanvasSize()
  const ctx = cv.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, cv.width, cv.height)

  const W = cv.width
  const H = cv.height

  // Attempt to use a real bounding box from a vehicle result
  let x = W * 0.15
  let y = H * 0.15
  let w = W * 0.70
  let h = H * 0.70

  if (result) {
    const vehicleHit = result.results.find(isVehicleResult) as VehicleImageResult | undefined
    const bb = vehicleHit?.data.detection?.bounding_box
    if (bb) {
      // API returns normalised coords (0–1)
      x = bb.x * W
      y = bb.y * H
      w = bb.width * W
      h = bb.height * H
    }
  }

  // Outer dim
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, W, H)

  // Clear inside the box so subject is visible
  ctx.clearRect(x, y, w, h)

  // Dashed border
  ctx.strokeStyle = status.value === 'detected' ? '#34d399' : '#6366f1'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 5])
  ctx.strokeRect(x, y, w, h)

  // Corner accents
  const corner = 18
  ctx.setLineDash([])
  ctx.lineWidth = 3
  ctx.strokeStyle = status.value === 'detected' ? '#10b981' : '#818cf8'
  // TL
  ctx.beginPath(); ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y); ctx.stroke()
  // TR
  ctx.beginPath(); ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner); ctx.stroke()
  // BR
  ctx.beginPath(); ctx.moveTo(x + w, y + h - corner); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - corner, y + h); ctx.stroke()
  // BL
  ctx.beginPath(); ctx.moveTo(x + corner, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - corner); ctx.stroke()
}

// Draw when scanning starts; redraw on detection; clear on stop
watch(status, (s) => {
  if (s === 'idle') {
    clearOverlay()
    return
  }
  if (s === 'scanning' || s === 'analyzing') {
    drawDetectionOverlay(null)
    return
  }
  if (s === 'detected') {
    drawDetectionOverlay(history.value[0] ?? null)
  }
})

// Also keep canvas sized correctly when the video loads / resizes
watch(cameraActive, (active) => {
  if (!active) { clearOverlay(); return }
  nextTick(() => drawDetectionOverlay(null))
})
</script>
