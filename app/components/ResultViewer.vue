<template>
  <div class="w-full">

    <!-- Loading state -->
    <Transition name="fade">
      <div v-if="loading" class="flex flex-col items-center justify-center gap-5 py-14">
        <div class="relative w-14 h-14">
          <div class="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
          <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin"></div>
          <!-- Inner pulse -->
          <div class="absolute inset-3 rounded-full bg-violet-500/10 animate-pulse"></div>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-zinc-300">Analyzing image…</p>
          <p class="text-xs text-zinc-600 mt-1">This may take a moment</p>
        </div>
      </div>
    </Transition>

    <!-- Error card -->
    <Transition name="slide">
      <div
        v-if="!loading && error"
        class="w-full rounded-2xl border border-red-900/50 bg-red-950/20 px-5 py-4 flex items-start gap-3"
      >
        <div class="mt-0.5 shrink-0 w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-red-400">Analysis failed</p>
          <p class="text-xs text-red-400/60 mt-0.5 leading-relaxed break-words">{{ error }}</p>
        </div>
      </div>
    </Transition>

    <!-- Result card -->
    <Transition name="fade">
      <div v-if="!loading && result" class="w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-lg shadow-black/20">

        <!-- Header row -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div class="flex items-center gap-2.5">
            <!-- Type badge -->
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
              :class="typeBadgeClass"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="typeDotClass"></span>
              {{ result.type || 'unknown' }}
            </span>
          </div>
          <!-- Toggle -->
          <button
            type="button"
            class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150"
            :class="showRaw
              ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
              : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'"
            @click="showRaw = !showRaw"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path v-if="showRaw" stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            {{ showRaw ? 'Formatted' : 'Raw JSON' }}
          </button>
        </div>

        <!-- Content -->
        <Transition name="fade" mode="out-in">
          <!-- Raw JSON -->
          <div v-if="showRaw" key="raw" class="p-5">
            <div class="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
              <pre class="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ prettyJson }}</pre>
            </div>
          </div>

          <!-- Formatted views -->
          <div v-else key="formatted" class="p-5">

            <!-- Receipt -->
            <template v-if="result.type === 'receipt'">
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                    <p class="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-widest">Store</p>
                    <p class="text-sm font-semibold text-zinc-100">{{ result.store || '—' }}</p>
                  </div>
                  <div class="rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                    <p class="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-widest">Date</p>
                    <p class="text-sm font-semibold text-zinc-100">{{ result.date || '—' }}</p>
                  </div>
                  <div class="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 col-span-2">
                    <p class="text-[10px] text-amber-500/70 mb-1.5 font-bold uppercase tracking-widest">Total</p>
                    <p class="text-2xl font-bold text-amber-400">{{ result.total || '—' }}</p>
                  </div>
                </div>
                <div v-if="Array.isArray(result.items) && result.items.length" class="rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">Items ({{ result.items.length }})</p>
                  <ul class="space-y-2">
                    <li v-for="(item, i) in result.items" :key="i" class="flex items-start gap-2.5 text-sm text-zinc-200">
                      <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>
                      <span>{{ typeof item === 'object' ? JSON.stringify(item) : item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </template>

            <!-- Vehicle -->
            <template v-else-if="result.type === 'vehicle'">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 sm:col-span-1">
                  <p class="text-[10px] text-sky-500/70 mb-1.5 font-bold uppercase tracking-widest">License Plate</p>
                  <p class="text-base font-mono font-bold text-sky-300 tracking-widest">{{ result.license_plate || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-widest">Vehicle Type</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ result.vehicle_type || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-widest">Color</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ result.color || '—' }}</p>
                </div>
              </div>
            </template>

            <!-- Unknown / generic fallback -->
            <template v-else>
              <div class="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                <pre class="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ prettyJson }}</pre>
              </div>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface AnalysisResult {
  type?: string
  store?: string
  date?: string
  total?: string | number
  items?: unknown[]
  license_plate?: string
  vehicle_type?: string
  color?: string
  [key: string]: unknown
}

const props = defineProps<{
  result: AnalysisResult | null
  loading: boolean
  error: string | null
}>()

const showRaw = ref(false)

watch(() => props.result, () => { showRaw.value = false })

const prettyJson = computed(() =>
  props.result ? JSON.stringify(props.result, null, 2) : '',
)

const typeBadgeClass = computed(() => {
  const t = props.result?.type
  if (t === 'receipt') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  if (t === 'vehicle') return 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
  return 'bg-zinc-700/40 text-zinc-400 border border-zinc-700'
})

const typeDotClass = computed(() => {
  const t = props.result?.type
  if (t === 'receipt') return 'bg-amber-400'
  if (t === 'vehicle') return 'bg-sky-400'
  return 'bg-zinc-500'
})
</script>
