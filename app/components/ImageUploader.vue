<template>
  <div class="w-full">
    <!-- Drop zone -->
    <div
      class="relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none"
      :class="[
        isDragging
          ? 'border-violet-500 bg-violet-500/10'
          : previewUrl
          ? 'border-zinc-700 bg-zinc-900'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/60',
      ]"
      style="min-height: 220px;"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="!previewUrl && triggerPicker()"
    >
      <!-- Empty state -->
      <template v-if="!previewUrl">
        <div class="flex flex-col items-center gap-3 py-10 px-6 pointer-events-none">
          <!-- Icon -->
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200"
            :class="isDragging ? 'bg-violet-500/20' : 'bg-zinc-800'"
          >
            <svg
              class="w-7 h-7 transition-colors duration-200"
              :class="isDragging ? 'text-violet-400' : 'text-zinc-400'"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-zinc-200">
              <span
                class="text-violet-400 hover:text-violet-300 transition-colors pointer-events-auto cursor-pointer"
                @click.stop="triggerPicker()"
                >Browse file</span
              >
              &nbsp;or drag & drop
            </p>
            <p class="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP, GIF up to 20&nbsp;MB</p>
          </div>
        </div>
      </template>

      <!-- Preview state -->
      <template v-else>
        <div class="relative w-full p-3">
          <img
            :src="previewUrl"
            alt="Image preview"
            class="w-full max-h-80 object-contain rounded-xl"
          />
          <!-- Clear button -->
          <button
            type="button"
            class="absolute top-5 right-5 w-7 h-7 rounded-full bg-zinc-950/80 backdrop-blur flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            @click.stop="clearFile()"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </template>
    </div>

    <!-- File info strip -->
    <div v-if="selectedFile" class="mt-2.5 flex items-center gap-2 px-1">
      <svg class="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
      <span class="text-xs text-zinc-400 truncate">{{ selectedFile.name }}</span>
      <span class="text-xs text-zinc-600 shrink-0">{{ formatSize(selectedFile.size) }}</span>
    </div>

    <!-- Hidden input -->
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'update:file': [file: File | null]
}>()

const isDragging = ref(false)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

function triggerPicker() {
  inputRef.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) applyFile(file)
  // Reset input value so same file can be re-selected
  if (inputRef.value) inputRef.value.value = ''
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    applyFile(file)
  }
}

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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>
