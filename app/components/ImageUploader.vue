<template>
  <div class="w-full space-y-4">

    <!-- Toast: incompatible file format -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastVisible"
        class="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-red-500/30 shadow-xl shadow-black/40 max-w-xs"
        role="alert"
      >
        <div class="shrink-0 w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-white">{{ toastTitle }}</p>
          <p class="text-xs text-zinc-400 mt-0.5">{{ toastMessage }}</p>
        </div>
      </div>
    </Transition>

    <!-- Source tabs -->
    <div class="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
        :class="mode === tab.id
          ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="switchMode(tab.id)"
      >{{ tab.label }}</button>
    </div>

    <!-- FILE MODE -->
    <Transition name="fade" mode="out-in">
      <div v-if="mode === 'file'" key="file" class="w-full">
        <div
          class="relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-300 select-none"
          :class="[
            isDraggingInvalid
              ? 'border-red-500/50 bg-red-500/5 cursor-no-drop opacity-60'
              : isDragging
                ? 'border-violet-500 bg-violet-500/10 scale-[1.01] cursor-copy'
                : disabled
                  ? 'border-zinc-800 bg-zinc-900/40 pointer-events-none opacity-60'
                  : 'border-zinc-700/70 bg-zinc-900/60 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer',
          ]"
          style="min-height: 220px;"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
          @click="triggerPicker()"
        >
      <!-- Empty state -->
          <template v-if="!activeCapture">
            <div class="flex flex-col items-center gap-4 py-12 px-6 pointer-events-none">
              <div
                class="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                :class="isDragging ? 'bg-violet-500/20 scale-110' : 'bg-zinc-800'"
              >
                <div v-if="isDragging" class="absolute inset-0 rounded-2xl ring-2 ring-violet-500/40 animate-pulse"></div>
                <svg
                  class="w-7 h-7 transition-colors duration-200"
                  :class="isDragging ? 'text-violet-400' : 'text-zinc-400'"
                  fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-zinc-300">
                  <span
                    class="text-violet-400 hover:text-violet-300 transition-colors pointer-events-auto cursor-pointer underline underline-offset-2 decoration-violet-500/40"
                    @click.stop="triggerPicker()"
                  >Browse file</span>
                  or drag &amp; drop
                </p>
                <p class="text-xs text-zinc-600 mt-1.5">PNG, JPG, WEBP · max 3 images</p>
              </div>
            </div>
          </template>

          <!-- Preview state -->
          <template v-else>
            <div class="relative w-full p-3">
              <img :src="activeCapture.url" alt="Preview" class="w-full max-h-80 object-contain rounded-xl" />
              <button
                v-if="!disabled"
                type="button"
                class="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all hover:scale-110"
                @click.stop="removeCapture(activeCapture.id)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <!-- Gallery strip -->
        <div v-if="captures.length > 0" class="w-full mt-3">
          <div class="flex items-center gap-2 mb-2 px-0.5">
            <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Files</span>
            <span class="text-xs text-zinc-600">({{ captures.length }})</span>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <!-- Thumbnails -->
            <div
              v-for="entry in captures"
              :key="entry.id"
              class="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105"
              :class="activeId === entry.id
                ? 'border-violet-500 shadow-md shadow-violet-900/40'
                : 'border-zinc-700 hover:border-zinc-500'"
              @click.stop="selectCapture(entry.id)"
            >
              <img :src="entry.url" :alt="entry.file.name" class="w-full h-full object-cover" />
              <button
                v-if="!disabled"
                type="button"
                class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-zinc-950/90 flex items-center justify-center text-zinc-400 hover:text-white"
                @click.stop="removeCapture(entry.id)"
              >
                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- "Add more" tile -->
            <button
              v-if="!disabled && captures.length < MAX_CAPTURES"
              type="button"
              title="Add more files"
              class="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/60 bg-zinc-900/60 hover:bg-violet-500/5 flex items-center justify-center text-zinc-600 hover:text-violet-400 transition-all"
              @click.stop="triggerPicker()"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Hidden input -->
        <input
          ref="inputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          class="hidden"
          @change="onFileChange"
        />
      </div>

      <!-- CAMERA MODE -->
      <div v-else key="camera" class="w-full space-y-3">

        <!-- Viewport -->
        <div
          class="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800"
          style="min-height: 280px;"
        >
          <!-- Start prompt -->
          <div
            v-if="!cameraActive && !activeCapture && !cameraError"
            class="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer group"
            @click="onStartCamera"
          >
            <div class="w-16 h-16 rounded-2xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors flex items-center justify-center">
              <svg class="w-8 h-8 text-zinc-400 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-medium text-zinc-300">Click to open camera</p>
              <p class="text-xs text-zinc-600 mt-1">Requires camera permission</p>
            </div>
          </div>

          <!-- Permission / device error -->
          <div v-if="cameraError" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <div class="w-12 h-12 rounded-full bg-red-950/50 border border-red-900/60 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-red-400">Camera unavailable</p>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">{{ cameraError }}</p>
            </div>
            <button type="button" class="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2" @click="onStartCamera">
              Try again
            </button>
          </div>

          <!-- Live video feed -->
          <video
            v-show="cameraActive && !activeCapture"
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          />

          <!-- Viewfinder + controls overlay (live only) -->
          <template v-if="cameraActive && !activeCapture">
            <!-- Corner viewfinder -->
            <div class="absolute inset-4 pointer-events-none">
              <span class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-400/70 rounded-tl-md"></span>
              <span class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-400/70 rounded-tr-md"></span>
              <span class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-400/70 rounded-bl-md"></span>
              <span class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-400/70 rounded-br-md"></span>
            </div>

            <!-- LIVE badge -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span class="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
            </div>

            <!-- Top-right controls -->
            <div class="absolute top-3 right-3 flex items-center gap-2">
              <!-- Torch toggle -->
              <button
                v-if="torchSupported"
                type="button"
                :title="torchOn ? 'Turn off flash' : 'Turn on flash'"
                class="w-8 h-8 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all"
                :class="torchOn
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                  : 'bg-zinc-950/80 border-zinc-700 text-zinc-400 hover:text-white'"
                @click="toggleTorch"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
              </button>

              <!-- Front/back flip -->
              <button
                v-if="canFlipCamera"
                type="button"
                title="Flip camera"
                class="w-8 h-8 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                @click="onToggleFacingMode"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>

              <!-- Close camera -->
              <button
                type="button"
                title="Close camera"
                class="w-8 h-8 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                @click="stopCamera"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Bottom bar: Auto toggle + Zoom slider side-by-side, never overlapping -->
            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <!-- Auto-analyze toggle -->
              <div class="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-zinc-800 shrink-0">
                <span class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider select-none">Auto</span>
                <button
                  type="button"
                  :aria-label="autoAnalyze ? 'Disable auto-analyze' : 'Enable auto-analyze'"
                  class="relative w-8 h-4 rounded-full transition-colors duration-200"
                  :class="autoAnalyze ? 'bg-violet-600' : 'bg-zinc-700'"
                  @click="autoAnalyze = !autoAnalyze"
                >
                  <span
                    class="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200"
                    :class="autoAnalyze ? 'left-4' : 'left-0.5'"
                  ></span>
                </button>
              </div>

              <!-- Zoom slider (only if hardware supports it) -->
              <div
                v-if="zoomSupported"
                class="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-zinc-800 min-w-0"
              >
                <svg class="w-3 h-3 text-zinc-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                </svg>
                <input
                  type="range"
                  :min="zoomMin"
                  :max="zoomMax"
                  :step="(zoomMax - zoomMin) / 20"
                  :value="zoomLevel"
                  class="w-16 min-w-0 h-1 accent-violet-500 cursor-pointer"
                  @input="onZoomInput"
                />
                <span class="text-[10px] text-zinc-500 w-6 text-right tabular-nums shrink-0">{{ zoomLevel.toFixed(1) }}×</span>
              </div>
            </div>
          </template>

          <!-- Captured preview (camera mode, after shot) -->
          <template v-if="!cameraActive && activeCapture">
            <img :src="activeCapture.url" alt="Captured photo" class="w-full h-full object-contain" />
            <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-[10px] font-bold text-white uppercase tracking-widest">Captured</span>
            </div>
            <button
              type="button"
              class="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              :class="disabled ? 'hidden' : ''"
              @click="removeCapture(activeCapture.id)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </template>

          <canvas ref="canvasRef" class="hidden" />
        </div>

        <!-- Capture button (live only) -->
        <button
          v-if="cameraActive && !activeCapture && captures.length < MAX_CAPTURES"
          type="button"
          class="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-semibold text-white transition-all active:scale-95"
          @click="onCapturePhoto"
        >
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          Capture Photo
        </button>

        <!-- Gallery strip (multi-capture thumbnails) -->
        <div v-if="captures.length > 0 && !cameraActive" class="w-full">
          <div class="flex items-center gap-2 mb-2 px-0.5">
            <span class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gallery</span>
            <span class="text-xs text-zinc-600">({{ captures.length }})</span>
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <!-- Thumbnails -->
            <div
              v-for="entry in captures"
              :key="entry.id"
              class="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105"
              :class="activeId === entry.id
                ? 'border-violet-500 shadow-md shadow-violet-900/40'
                : 'border-zinc-700 hover:border-zinc-500'"
              @click="selectCapture(entry.id)"
            >
              <img :src="entry.url" :alt="entry.file.name" class="w-full h-full object-cover" />
              <button
                v-if="!disabled"
                type="button"
                class="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-zinc-950/90 flex items-center justify-center text-zinc-400 hover:text-white"
                @click.stop="removeCapture(entry.id)"
              >
                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- "Add another" tile -->
            <button
              v-if="!disabled && captures.length < MAX_CAPTURES"
              type="button"
              title="Take another photo"
              class="shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-zinc-700 hover:border-violet-500/60 bg-zinc-900/60 hover:bg-violet-500/5 flex items-center justify-center text-zinc-600 hover:text-violet-400 transition-all"
              @click="onAddAnother"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /**
   * Locks the entire uploader — hides remove/add controls and prevents
   * all user interaction. Use while an analysis request is in-flight.
   */
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{
  /** Last-activated file (unchanged for backwards compat) */
  'update:file': [file: File | null]
  /** Full gallery as a File[] — fires on every gallery mutation */
  'update:files': [files: File[]]
  /** Full gallery with stable IDs — use to track which result matches which image */
  'update:captures': [captures: { id: string; file: File }[]]
  'analyze': []
}>()

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'file' | 'camera'

interface CaptureEntry {
  id: string
  file: File
  url: string
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'file' as Mode, label: '⬆ Upload File' },
  { id: 'camera' as Mode, label: '📷 Camera' },
]
const mode = ref<Mode>('file')

function switchMode(newMode: Mode) {
  if (props.disabled || newMode === mode.value) return
  if (mode.value === 'camera') stopCamera()
  mode.value = newMode
}

// ── Auto-analyze toggle ───────────────────────────────────────────────────────
const autoAnalyze = ref(false)

// ── Gallery / capture state ───────────────────────────────────────────────────
const captures = ref<CaptureEntry[]>([])
const activeId = ref<string | null>(null)

const activeCapture = computed<CaptureEntry | null>(
  () => captures.value.find((c) => c.id === activeId.value) ?? null,
)

function emitGallery() {
  emit('update:files', captures.value.map((c) => c.file))
  emit('update:captures', captures.value.map((c) => ({ id: c.id, file: c.file })))
}

function addCapture(file: File) {
  if (props.disabled) return
  if (captures.value.length >= MAX_CAPTURES) return
  if (captures.value.some(c => c.file.name === file.name)) {
    showToast('Duplicate image', 'You may have already added this image.')
    return
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const url = URL.createObjectURL(file)
  captures.value.push({ id, file, url })
  activeId.value = id
  emit('update:file', file)
  emitGallery()
  if (autoAnalyze.value) emit('analyze')
}

function selectCapture(id: string) {
  activeId.value = id
  const entry = captures.value.find((c) => c.id === id)
  if (entry) emit('update:file', entry.file)
}

function removeCapture(id: string) {
  if (props.disabled) return
  const idx = captures.value.findIndex((c) => c.id === id)
  if (idx === -1) return
  URL.revokeObjectURL(captures.value[idx].url)
  captures.value.splice(idx, 1)

  if (activeId.value === id) {
    const next = captures.value[Math.max(0, idx - 1)]
    activeId.value = next?.id ?? null
    emit('update:file', next?.file ?? null)
  }
  emitGallery()
}

// ── File upload (FILE mode) ───────────────────────────────────────────────────
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const isAllowed = (type: string) => ALLOWED_TYPES.has(type)
const MAX_CAPTURES = 3

const isDragging = ref(false)
const isDraggingInvalid = ref(false)
const toastVisible = ref(false)
const toastTitle = ref('Incompatible format')
const toastMessage = ref('Only PNG, JPG and WEBP are accepted.')
let toastTimer: ReturnType<typeof setTimeout> | null = null
const inputRef = ref<HTMLInputElement | null>(null)

function triggerPicker() { if (!props.disabled) inputRef.value?.click() }

function showToast(title = 'Incompatible format', message = 'Only PNG, JPG and WEBP are accepted.') {
  toastTitle.value = title
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastVisible.value = true
  toastTimer = setTimeout(() => { toastVisible.value = false }, 3500)
}

function onDragOver(event: DragEvent) {
  if (props.disabled) return
  const items = Array.from(event.dataTransfer?.items ?? [])
  const hasFiles = items.some(i => i.kind === 'file')
  if (!hasFiles) return
  const allImages = items
    .filter(i => i.kind === 'file')
    .every(i => isAllowed(i.type))
  isDraggingInvalid.value = !allImages
  isDragging.value = allImages
}

function onDragLeave() {
  isDragging.value = false
  isDraggingInvalid.value = false
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  const remaining = MAX_CAPTURES - captures.value.length
  const valid = files.filter(f => isAllowed(f.type))
  const hasInvalid = valid.length < files.length
  const toAdd = valid.slice(0, remaining)
  const capped = valid.length > remaining
  toAdd.forEach(f => addCapture(f))
  if (hasInvalid) showToast()
  else if (capped) showToast('Limit reached', 'Maximum 3 images allowed.')
  if (inputRef.value) inputRef.value.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  isDraggingInvalid.value = false
  if (props.disabled) return
  const files = Array.from(event.dataTransfer?.files ?? [])
  const imageFiles = files.filter(file => isAllowed(file.type))
  const hasInvalid = files.some(file => !isAllowed(file.type))
  const remaining = MAX_CAPTURES - captures.value.length
  const toAdd = imageFiles.slice(0, remaining)
  const capped = imageFiles.length > remaining
  toAdd.forEach(f => addCapture(f))
  if (hasInvalid) showToast()
  else if (capped) showToast('Limit reached', 'Maximum 3 images allowed.')
}

// ── Camera ────────────────────────────────────────────────────────────────────
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const {
  cameraActive,
  cameraError,
  zoomLevel,
  zoomMin,
  zoomMax,
  zoomSupported,
  torchOn,
  torchSupported,
  hasMultipleCameras,
  canFlipCamera,
  startCamera,
  stopCamera,
  toggleFacingMode,
  setZoom,
  toggleTorch,
  captureFrame,
} = useCamera()

async function onStartCamera() {
  if (props.disabled || !videoRef.value) return
  await nextTick()
  await startCamera(videoRef.value, canvasRef.value ?? undefined)
}

async function onToggleFacingMode() {
  if (!videoRef.value) return
  await toggleFacingMode(videoRef.value, canvasRef.value ?? undefined)
}

function onZoomInput(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  setZoom(value)
}

async function onCapturePhoto() {
  if (!videoRef.value || !canvasRef.value) return
  try {
    const file = await captureFrame(videoRef.value, canvasRef.value)
    stopCamera()
    addCapture(file)
  } catch {
    // capture failed silently
  }
}

function onAddAnother() {
  if (props.disabled) return
  activeId.value = null
  onStartCamera()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
onUnmounted(() => {
  captures.value.forEach((c) => URL.revokeObjectURL(c.url))
  if (toastTimer) clearTimeout(toastTimer)
  // Camera stream cleanup handled by useCamera's own onUnmounted
})
</script>
