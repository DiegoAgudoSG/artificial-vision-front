<template>
  <main class="min-h-screen flex flex-col items-center px-4 py-16 sm:py-24">
    <!-- Header -->
    <div class="w-full max-w-2xl text-center mb-12">
      <!-- Logo mark -->
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-6">
        <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </div>

      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
        AI Vision Agent
      </h1>
      <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-md mx-auto">
        Upload an image to extract information automatically
      </p>
    </div>

    <!-- Card -->
    <div class="w-full max-w-2xl space-y-6">
      <!-- Upload section -->
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
        <div class="flex items-center gap-2 mb-5">
          <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">1</span>
          <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Upload Image</h2>
        </div>
        <ImageUploader @update:file="file = $event" />
      </div>

      <!-- Analyze button -->
      <button
        type="button"
        :disabled="!file || loading"
        class="w-full rounded-2xl px-6 py-4 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        :class="[
          !file || loading
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-800/40',
        ]"
        @click="handleAnalyze"
      >
        <!-- Spinner inside button -->
        <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
        <svg
          v-else
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
        {{ loading ? 'Analyzing…' : 'Analyze Image' }}
      </button>

      <!-- Result section -->
      <Transition name="fade">
        <div v-if="loading || result || error" class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
          <div class="flex items-center gap-2 mb-5">
            <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">2</span>
            <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Analysis Result</h2>
          </div>
          <ResultViewer :result="result" :loading="loading" :error="error" />
        </div>
      </Transition>
    </div>

    <!-- Footer -->
    <p class="mt-16 text-xs text-zinc-700">
      AI Vision Agent &mdash; Hackathon Build &mdash; {{ new Date().getFullYear() }}
    </p>
  </main>
</template>

<script setup lang="ts">
const file = ref<File | null>(null)
const loading = ref(false)
const result = ref<Record<string, unknown> | null>(null)
const error = ref<string | null>(null)

async function handleAnalyze() {
  if (!file.value || loading.value) return

  loading.value = true
  result.value = null
  error.value = null

  try {
    const formData = new FormData()
    formData.append('image', file.value)

    const response = await $fetch<Record<string, unknown>>('/api/analyze', {
      method: 'POST',
      body: formData,
    })

    result.value = response
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else if (typeof err === 'object' && err !== null && 'data' in err) {
      const fetchErr = err as { data?: { message?: string }; status?: number }
      error.value =
        fetchErr.data?.message ??
        `Request failed with status ${fetchErr.status ?? 'unknown'}`
    } else {
      error.value = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
