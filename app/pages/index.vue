<template>
  <main class="min-h-screen flex flex-col items-center px-4 py-16 sm:py-24 relative overflow-hidden">

    <!-- Background glow blobs -->
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]"></div>
      <div class="absolute top-1/2 -right-32 w-[400px] h-[500px] rounded-full bg-indigo-900/15 blur-[100px]"></div>
    </div>

    <!-- Header -->
    <div class="w-full max-w-2xl text-center mb-12">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-6 ring-1 ring-violet-500/10 ring-offset-4 ring-offset-zinc-950">
        <svg class="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </div>
      <!-- Pill badge -->
      <div class="flex justify-center mb-5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
          <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
          AI Powered
        </span>
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
        AI Vision Agent
      </h1>
      <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-md mx-auto">
        Upload an image or take a photo to extract structured information automatically
      </p>
    </div>

    <!-- Main card -->
    <div class="w-full max-w-2xl space-y-5">

      <!-- Upload section -->
      <div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
        <div class="flex items-center gap-2.5 mb-5">
          <span class="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">1</span>
          <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Choose Image</h2>
        </div>
        <ImageUploader @update:file="onFileUpdate" />
      </div>

      <!-- Analyze button -->
      <button
        type="button"
        :disabled="!file || loading"
        class="w-full rounded-2xl px-6 py-4 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        :class="[
          !file || loading
            ? 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-800/50 border border-violet-500/20',
        ]"
        @click="handleAnalyze"
      >
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
        <div v-if="loading || result || error" class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
          <div class="flex items-center gap-2.5 mb-5">
            <span class="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">2</span>
            <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Analysis Result</h2>
          </div>
          <ResultViewer :result="result" :loading="loading" :error="error" />
        </div>
      </Transition>
    </div>

    <!-- Footer -->
    <div class="mt-16 flex items-center gap-2 text-xs text-zinc-700">
      <span>AI Vision Agent</span>
      <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
      <span>Hackathon Build</span>
      <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
      <span>{{ new Date().getFullYear() }}</span>
    </div>
  </main>
</template>

<script setup lang="ts">
const file = ref<File | null>(null)
const loading = ref(false)
const result = ref<Record<string, unknown> | null>(null)
const error = ref<string | null>(null)

function onFileUpdate(f: File | null) {
  file.value = f
  // Clear previous results when a new file is chosen
  if (f) {
    result.value = null
    error.value = null
  }
}

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
