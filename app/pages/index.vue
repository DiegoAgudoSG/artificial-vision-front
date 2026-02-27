<template>
  <main class="min-h-screen flex flex-col items-center px-4 py-8">
    <!-- Header -->
    <div class="w-full max-w-2xl text-center mb-12">
      <!-- Logo mark -->
      <NuxtLink to="/" class="inline-flex items-center justify-center w-45 h-45 rounded-2xl ">
        <img src="~/assets/img/logo.png" alt="Logo" />
      </NuxtLink>

      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
        AI Vision Agent
      </h1>
      <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-md mx-auto">
        Analyzes images and video in real time using AI: detects and extracts data from purchase receipts and vehicle license plates.
      </p>
    </div>

    <!-- Tab switcher -->
    <div class="w-full max-w-2xl mb-2">
      <div class="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-1">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'upload'
            ? 'bg-zinc-700 text-white shadow'
            : 'text-zinc-500 hover:text-zinc-300'"
          @click="activeTab = 'upload'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          :class="activeTab === 'live'
            ? 'bg-zinc-700 text-white shadow'
            : 'text-zinc-500 hover:text-zinc-300'"
          @click="activeTab = 'live'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          Live Detection
        </button>
      </div>
    </div>

    <!-- Card -->
    <div class="w-full max-w-2xl space-y-6">

      <!-- ── Upload tab ──────────────────────────────────────────────────── -->
      <template v-if="activeTab === 'upload'">
      <!-- Upload section -->
      <div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
        <div class="flex items-center gap-2 mb-5">
          <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">1</span>
          <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Upload Image</h2>
        </div>
        <ImageUploader :disabled="loading" @update:captures="captures = $event" @analyze="handleAnalyze" />
      </div>

      <!-- Analyze button -->
      <button
        type="button"
        :disabled="!captures.length || loading"
        class="w-full rounded-2xl px-6 py-4 font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
        :class="[
          !captures.length || loading
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
        <div v-if="loading || result || error" ref="resultSection" class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
          <div class="flex items-center gap-2 mb-5">
            <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">2</span>
            <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Analysis Result</h2>
          </div>
          <ResultViewer :result="filteredResult" :loading="loading" :error="error" />
        </div>
      </Transition>
      </template>

      <!-- ── Live Detection tab ──────────────────────────────────────────── -->
      <template v-if="activeTab === 'live'">
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur p-6">
          <div class="flex items-center gap-2 mb-5">
            <span class="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">1</span>
            <h2 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Live Detection</h2>
            <span class="ml-auto text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <LiveDetector />
        </div>
      </template>

    </div>

    <!-- Footer -->
    <p class="mt-16 text-xs text-zinc-700">
      AI Vision Agent &mdash; Hackathon Build &mdash; {{ new Date().getFullYear() }}
    </p>
  </main>
</template>

<script setup lang="ts">
import type { AnalysisResponse } from '~/types/analysis'
import { isTicketResult, isVehicleResult } from '~/types/analysis'

const activeTab = ref<'upload' | 'live'>('upload')
const captures = ref<{ id: string; file: File }[]>([])
const submittedIds = ref<string[]>([])
const { loading, result, error, analyze } = useAnalyze()
const resultSection = ref<HTMLElement | null>(null)

/**
 * Derives a filtered AnalysisResponse that only keeps results whose gallery
 * entry hasn’t been removed since the last analysis run.
 * The summary counts are recalculated to stay consistent.
 */
const filteredResult = computed<AnalysisResponse | null>(() => {
  if (!result.value || !submittedIds.value.length) return result.value

  const presentIds = new Set(captures.value.map((c) => c.id))
  const filteredResults = result.value.results.filter((_, i) => {
    const id = submittedIds.value[i]
    return id !== undefined && presentIds.has(id)
  })

  if (filteredResults.length === result.value.results.length) return result.value

  // Recompute summary from surviving results
  const survivingTickets = filteredResults.filter(isTicketResult)
  const totalTickets = survivingTickets.length
  const vehiclesDetected = filteredResults.filter((r) => r.type === 'vehicle').length
  const vehicleTypes: Record<string, number> = {}
  filteredResults.filter(isVehicleResult).forEach((r) => {
    const vt = r.data.vehicle.vehicle_type ?? 'unknown'
    vehicleTypes[vt] = (vehicleTypes[vt] ?? 0) + 1
  })

  // combined_total: only when all surviving tickets share the same currency
  const currencies = [...new Set(survivingTickets.map((r) => r.data.ticket.currency ?? 'unknown'))]
  const combined_total = currencies.length === 1 && currencies[0] !== 'unknown'
    ? { amount: survivingTickets.reduce((sum, r) => sum + r.data.totals.total, 0), currency: currencies[0] }
    : undefined

  return {
    ...result.value,
    results: filteredResults,
    summary: { total_tickets: totalTickets, combined_total, vehicles_detected: vehiclesDetected, vehicle_types: vehicleTypes },
  }
})

async function handleAnalyze() {
  if (!captures.value.length) return
  submittedIds.value = captures.value.map((c) => c.id)
  analyze(captures.value.map((c) => c.file))
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
