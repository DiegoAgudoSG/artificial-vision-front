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

    <!-- ── Results table ──────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="analyzing || tableRows.length || error"
        class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur overflow-hidden"
      >
        <!-- Header bar -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">2</span>
            <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Analysis Result</h2>
            <span
              v-if="analyzing"
              class="w-3.5 h-3.5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
            />
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Table Overview</p>
              <p v-if="tableRows.length" class="text-[10px] text-zinc-600">
                Vehicles in Batch: {{ tableRows.length }}
              </p>
            </div>
            <button
              v-if="tableRows.length"
              type="button"
              class="text-[10px] font-medium text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
              @click="clearHistory()"
            >Clear all</button>
          </div>
        </div>

        <!-- Error band -->
        <div
          v-if="!analyzing && error"
          class="px-5 py-3 border-b border-red-900/40 bg-red-950/30 text-xs text-red-400"
        >{{ error }}</div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-zinc-800/80">
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider w-14">ID</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider w-20">Image</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider">Plate</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider">Brand</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider">Model</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider">Color</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wider w-28">Conf. %</th>
                <th class="px-4 py-3 text-center font-semibold text-zinc-500 uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <TransitionGroup name="slide" tag="tbody">
              <tr
                v-for="row in tableRows"
                :key="row.entry.id"
                class="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group"
              >
                <!-- ID -->
                <td class="px-4 py-3 font-mono font-bold text-zinc-300">{{ row.entry.id }}</td>

                <!-- Thumbnail -->
                <td class="px-4 py-3">
                  <img
                    :src="row.entry.thumbnail"
                    alt="Vehicle thumbnail"
                    class="w-16 h-10 object-cover rounded-lg border border-zinc-700"
                  />
                </td>

                <!-- Plate -->
                <td class="px-4 py-3">
                  <span
                    v-if="row.vehicle?.license_plate"
                    class="font-mono font-bold text-sky-300 tracking-widest text-[11px]"
                  >{{ row.vehicle.license_plate }}</span>
                  <span v-else class="text-zinc-600">—</span>
                </td>

                <!-- Brand -->
                <td class="px-4 py-3 text-zinc-300">{{ row.vehicle?.brand || '—' }}</td>

                <!-- Model -->
                <td class="px-4 py-3 text-zinc-300">{{ row.vehicle?.model || '—' }}</td>

                <!-- Color -->
                <td class="px-4 py-3 text-zinc-300 capitalize">{{ row.vehicle?.color || '—' }}</td>

                <!-- Type -->
                <td class="px-4 py-3 text-zinc-300 capitalize">{{ row.vehicle?.vehicle_type || '—' }}</td>

                <!-- Confidence -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-14 rounded-full bg-zinc-700 overflow-hidden shrink-0">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="rowConfBarColor(row.conf)"
                        :style="{ width: rowConfPct(row.conf) }"
                      />
                    </div>
                    <span class="font-mono" :class="rowConfColor(row.conf)">{{ rowConfPct(row.conf) }}</span>
                  </div>
                </td>

                <!-- Actions -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      title="View details"
                      class="p-1.5 rounded-lg text-zinc-500 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                      @click="selectedEntry = row.entry"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Delete entry"
                      class="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      @click="removeEntry(row.entry.id)"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Empty state while no rows yet -->
              <tr v-if="!tableRows.length && analyzing" key="analyzing-row">
                <td colspan="9" class="px-5 py-8 text-center text-zinc-600 text-xs">
                  Waiting for first detection…
                </td>
              </tr>
            </TransitionGroup>
          </table>
        </div>
      </div>
    </Transition>

  </div>

  <!-- ── Detail modal ────────────────────────────────────────────────────── -->
  <Transition name="fade">
    <div
      v-if="selectedEntry"
      class="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-start justify-center p-6 overflow-y-auto"
      @click.self="selectedEntry = null"
    >
      <div class="w-full max-w-2xl">
        <div class="flex justify-end mb-3">
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full transition-colors"
            @click="selectedEntry = null"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
        <ResultViewer :result="selectedEntry.result" :loading="false" :error="null" />
      </div>
    </div>
  </Transition>

  <!-- ── Detection toast ────────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="toast.visible && toast.entry"
        class="fixed bottom-6 right-6 z-[60] w-72 rounded-2xl border border-emerald-500/30 bg-zinc-900/95 backdrop-blur-md shadow-2xl shadow-zinc-950/60 overflow-hidden"
      >
        <!-- Green top accent bar -->
        <div class="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

        <div class="flex items-start gap-3 px-4 py-3.5">
          <!-- Thumbnail -->
          <img
            :src="toast.entry.thumbnail"
            alt=""
            class="w-14 h-9 rounded-lg object-cover border border-zinc-700 shrink-0 mt-0.5"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Detection {{ toast.entry.id }}</span>
            </div>
            <p
              v-if="toastVehicle?.license_plate"
              class="font-mono font-bold text-sky-300 tracking-widest text-sm truncate"
            >{{ toastVehicle.license_plate }}</p>
            <p v-else class="text-xs text-zinc-500 italic">Plate not readable</p>
            <p class="text-[11px] text-zinc-400 truncate mt-0.5">
              {{ [toastVehicle?.brand, toastVehicle?.model].filter(Boolean).join(' ') || toastVehicle?.vehicle_type || '—' }}
            </p>
          </div>

          <!-- Dismiss -->
          <button
            type="button"
            class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 -mt-0.5 -mr-1"
            @click="toast.visible = false"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Auto-dismiss progress bar -->
        <div class="h-0.5 bg-zinc-800">
          <div
            class="h-full bg-emerald-500/40 toast-shrink"
          />
        </div>
      </div>
    </Transition>
  </Teleport></template>

<script setup lang="ts">
import type { VehicleImageResult } from '~/types/analysis'
import { isVehicleResult } from '~/types/analysis'
import type { HistoryEntry, LiveStatus } from '~/composables/useLiveDetection'

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
  removeEntry,
} = useLiveDetection(videoEl, canvasEl)

// ── Detail modal ──────────────────────────────────────────────────────────────

const selectedEntry = ref<HistoryEntry | null>(null)

// ── Table rows ────────────────────────────────────────────────────────────────

interface TableRow {
  entry: HistoryEntry
  vehicle: VehicleImageResult['data']['vehicle'] | null
  conf: number
}

const tableRows = computed<TableRow[]>(() =>
  history.value.map((entry) => {
    const vehicleHit = entry.result.results.find(isVehicleResult) as VehicleImageResult | undefined
    return {
      entry,
      vehicle: vehicleHit?.data.vehicle ?? null,
      conf: vehicleHit?.confidence ?? 0,
    }
  }),
)

// ── Per-row confidence helpers ────────────────────────────────────────────────

function rowConfPct(conf: number): string {
  return `${(conf * 100).toFixed(0)}%`
}

function rowConfColor(conf: number): string {
  if (conf >= 0.8) return 'text-emerald-400'
  if (conf >= 0.6) return 'text-amber-400'
  return 'text-orange-400'
}

function rowConfBarColor(conf: number): string {
  if (conf >= 0.8) return 'bg-emerald-500'
  if (conf >= 0.6) return 'bg-amber-500'
  return 'bg-orange-500'
}

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

// ── Toast notification ────────────────────────────────────────────────────────

const toast = reactive<{ visible: boolean; entry: HistoryEntry | null }>({
  visible: false,
  entry: null,
})

const toastVehicle = computed(() => {
  if (!toast.entry) return null
  const hit = toast.entry.result.results.find(isVehicleResult) as VehicleImageResult | undefined
  return hit?.data.vehicle ?? null
})

let toastTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => history.value.length,
  (newLen, oldLen) => {
    if (newLen <= oldLen) return
    if (toastTimer) clearTimeout(toastTimer)
    toast.entry = history.value[0] ?? null
    toast.visible = true
    toastTimer = setTimeout(() => { toast.visible = false }, 3500)
  },
)

onUnmounted(() => { if (toastTimer) clearTimeout(toastTimer) })

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
    drawDetectionOverlay(history.value[0]?.result ?? null)
  }
})

// Also keep canvas sized correctly when the video loads / resizes
watch(cameraActive, (active) => {
  if (!active) { clearOverlay(); return }
  nextTick(() => drawDetectionOverlay(null))
})
</script>
