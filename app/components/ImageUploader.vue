<template>
  <div class="w-full space-y-4">

    <!-- Source tabs -->
    <div class="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
        :class="mode === tab.id ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40' : 'text-zinc-500 hover:text-zinc-300'"
        @click="switchMode(tab.id)"
      >{{ tab.label }}</button>
    </div>

    <!-- FILE MODE -->
    <Transition name="fade" mode="out-in">
      <div v-if="mode === 'file'" key="file" class="w-full">
        <div
          class="relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer select-none"
          :class="[isDragging ? 'border-violet-500 bg-violet-500/10 scale-[1.01]' : previewUrl ? 'border-zinc-700 bg-zinc-900 cursor-default' : 'border-zinc-700/70 bg-zinc-900/60 hover:border-violet-500/50 hover:bg-violet-500/5']"
          style="min-height: 220px;"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          @click="!previewUrl && triggerPicker()"
        >
          <template v-if="!previewUrl">
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
                <p class="text-xs text-zinc-600 mt-1.5">PNG, JPG, WEBP, GIF — up to 20 MB</p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="relative w-full p-3">
              <img :src="previewUrl" alt="Preview" class="w-full max-h-80 object-contain rounded-xl" />
              <button
                type="button"
                class="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all hover:scale-110"
                @click.stop="clearFile()"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>
        </div>

        <!-- File info -->
        <div v-if="selectedFile" class="mt-3 flex items-center gap-2 px-1">
          <div class="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          <span class="text-xs text-zinc-400 truncate">{{ selectedFile.name }}</span>
          <span class="ml-auto text-xs text-zinc-600 shrink-0">{{ formatSize(selectedFile.size) }}</span>
        </div>

        <input ref="inputRef" type="file" accept="image/*" class="hidden" @change="onFileChange" />
      </div>

      <!-- CAMERA MODE -->
      <div v-else key="camera" class="w-full space-y-3">
        <div
          class="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800"
          style="min-height: 260px;"
        >
          <!-- Start prompt -->
          <div
            v-if="!cameraActive && !previewUrl && !cameraError"
            class="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer group"
            @click="startCamera"
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

          <!-- Permission error -->
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
            <button type="button" class="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2" @click="startCamera">
              Try again
            </button>
          </div>

          <!-- Live video feed -->
          <video
            v-show="cameraActive && !previewUrl"
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          />

          <!-- Viewfinder overlay -->
          <template v-if="cameraActive && !previewUrl">
            <div class="absolute inset-4 pointer-events-none">
              <span class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-400/70 rounded-tl-md"></span>
              <span class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-400/70 rounded-tr-md"></span>
              <span class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-400/70 rounded-bl-md"></span>
              <span class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-400/70 rounded-br-md"></span>
            </div>
            <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-sm px-2 py-1 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span class="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
            </div>
            <button
              type="button"
              class="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              @click="stopCamera"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </template>

          <!-- Captured preview -->
          <template v-if="previewUrl">
            <img :src="previewUrl" alt="Captured photo" class="w-full h-full object-contain" />
            <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/70 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg class="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span class="text-[10px] font-bold text-white uppercase tracking-widest">Captured</span>
            </div>
            <button
              type="button"
              class="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-950/80 backdrop-blur-sm border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              @click="retakePhoto"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </template>

          <canvas ref="canvasRef" class="hidden" />
        </div>

        <!-- Capture button -->
        <button
          v-if="cameraActive && !previewUrl"
          type="button"
          class="w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-semibold text-white transition-all active:scale-95"
          @click="capturePhoto"
        >
          <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          Capture Photo
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'update:file': [file: File | null]
}>()

type Mode = 'file' | 'camera'
const tabs = [
  { id: 'file' as Mode, label: '⬆ Upload File' },
  { id: 'camera' as Mode, label: '📷 Camera' },
]
const mode = ref<Mode>('file')

function switchMode(newMode: Mode) {
  if (newMode === mode.value) return
  clearFile()
  if (mode.value === 'camera') stopCamera()
  mode.value = newMode
}

// File upload
const isDragging = ref(false)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

function triggerPicker() { inputRef.value?.click() }

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) applyFile(file)
  if (inputRef.value) inputRef.value.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) applyFile(file)
}

// Camera
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref<string | null>(null)
let stream: MediaStream | null = null

async function startCamera() {
  cameraError.value = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
    })
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      cameraActive.value = true
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Permission') || msg.includes('NotAllowed'))
      cameraError.value = 'Camera access was denied. Allow camera permission in your browser settings.'
    else if (msg.includes('NotFound') || msg.includes('DevicesNotFound'))
      cameraError.value = 'No camera device found on this device.'
    else
      cameraError.value = msg
  }
}

function stopCamera() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
  cameraActive.value = false
  if (videoRef.value) videoRef.value.srcObject = null
}

function capturePhoto() {
  if (!videoRef.value || !canvasRef.value) return
  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  stopCamera()
  canvas.toBlob((blob) => {
    if (!blob) return
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    applyFile(file)
  }, 'image/jpeg', 0.92)
}

function retakePhoto() {
  clearPreview()
  emit('update:file', null)
  startCamera()
}

// Shared helpers
function applyFile(file: File) {
  clearPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  emit('update:file', file)
}

function clearFile() {
  clearPreview()
  emit('update:file', null)
}

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  selectedFile.value = null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  stopCamera()
})
</script>
