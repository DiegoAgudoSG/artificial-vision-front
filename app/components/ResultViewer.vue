<template>
  <div class="w-full">
    <!-- Loading spinner -->
    <Transition name="fade">
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
        <div class="relative w-12 h-12">
          <!-- Outer ring -->
          <div class="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
          <!-- Spinning arc -->
          <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin"></div>
        </div>
        <p class="text-sm text-zinc-500 font-medium">Analyzing image…</p>
      </div>
    </Transition>

    <!-- Error card -->
    <Transition name="slide">
      <div
        v-if="!loading && error"
        class="w-full rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 flex items-start gap-3"
      >
        <div class="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg class="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-red-400">Analysis failed</p>
          <p class="text-xs text-red-400/70 mt-0.5 leading-relaxed">{{ error }}</p>
        </div>
      </div>
    </Transition>

    <!-- Result card -->
    <Transition name="fade">
      <div v-if="!loading && result" class="w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <!-- Card header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div class="flex items-center gap-2.5">
            <!-- Type badge -->
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
              :class="typeBadgeClass"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="typeDotClass"></span>
              {{ result.type || 'unknown' }}
            </span>
          </div>
          <!-- Raw / Formatted toggle -->
          <button
            type="button"
            class="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-150"
            :class="
              showRaw
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
            "
            @click="showRaw = !showRaw"
          >
            {{ showRaw ? 'Formatted view' : 'Raw JSON' }}
          </button>
        </div>

        <!-- Raw JSON -->
        <Transition name="fade" mode="out-in">
          <div v-if="showRaw" key="raw" class="p-5">
            <pre class="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ prettyJson }}</pre>
          </div>

          <!-- Formatted views -->
          <div v-else key="formatted" class="p-5">
            <!-- Receipt -->
            <template v-if="result.type === 'receipt'">
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                    <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Store</p>
                    <p class="text-sm font-semibold text-zinc-100">{{ result.store || '—' }}</p>
                  </div>
                  <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                    <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Date</p>
                    <p class="text-sm font-semibold text-zinc-100">{{ result.date || '—' }}</p>
                  </div>
                  <div class="rounded-xl bg-zinc-800/60 px-4 py-3 col-span-2">
                    <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Total</p>
                    <p class="text-xl font-bold text-zinc-100">{{ result.total || '—' }}</p>
                  </div>
                </div>
                <!-- Items list -->
                <div v-if="Array.isArray(result.items) && result.items.length" class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Items</p>
                  <ul class="space-y-1.5">
                    <li
                      v-for="(item, i) in result.items"
                      :key="i"
                      class="flex items-center gap-2 text-sm text-zinc-200"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>
                      <span>{{ typeof item === 'object' ? JSON.stringify(item) : item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </template>

            <!-- Vehicle -->
            <template v-else-if="result.type === 'vehicle'">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">License Plate</p>
                  <p class="text-base font-mono font-bold text-zinc-100 tracking-widest">{{ result.license_plate || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Vehicle Type</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ result.vehicle_type || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">Color</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ result.color || '—' }}</p>
                </div>
              </div>
            </template>

            <!-- Unknown / generic -->
            <template v-else>
              <pre class="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ prettyJson }}</pre>
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
  // receipt
  store?: string
  date?: string
  total?: string | number
  items?: unknown[]
  // vehicle
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

// Reset toggle when result changes
watch(
  () => props.result,
  () => { showRaw.value = false },
)

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
