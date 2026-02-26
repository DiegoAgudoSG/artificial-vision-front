<template>
  <div class="w-full space-y-4">
    <!-- Loading spinner -->
    <Transition name="fade">
      <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-16">
        <div class="relative w-12 h-12">
          <div class="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
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

    <!-- Batch results -->
    <Transition name="fade">
      <div v-if="!loading && result" class="w-full space-y-4">

        <!-- Batch summary bar (tiles shown only when the group has results) -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Batch summary</span>
              <span class="text-[10px] text-zinc-600 font-mono">{{ result.meta.batch_id }}</span>
            </div>
            <span class="text-[10px] text-zinc-600">{{ formatDate(result.meta.processed_at) }}</span>
          </div>
          <div class="flex flex-wrap gap-3">
            <template v-if="ticketResults.length">
              <div class="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
                <p class="text-lg font-bold text-amber-400">{{ result.summary.total_tickets }}</p>
                <p class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Tickets</p>
              </div>
              <div class="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
                <p class="text-lg font-bold text-emerald-400">{{ formatCurrency(result.summary.total_spent) }}</p>
                <p class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Spent</p>
              </div>
            </template>
            <template v-if="vehicleResults.length">
              <div class="flex-1 min-w-[80px] rounded-xl bg-zinc-800/60 px-3 py-2.5 text-center">
                <p class="text-lg font-bold text-sky-400">{{ result.summary.vehicles_detected }}</p>
                <p class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Vehicles</p>
              </div>
            </template>
          </div>
        </div>

        <!-- ── Tickets section ──────────────────────────────────────── -->
        <div v-if="ticketResults.length" class="space-y-3">
          <!-- Collapsible header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 group"
            @click="ticketsOpen = !ticketsOpen"
          >
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Tickets
              <span class="ml-0.5 text-amber-500/60 font-normal">({{ ticketResults.length }})</span>
            </span>
            <div class="flex-1 h-px bg-zinc-800 group-hover:bg-zinc-700 transition-colors"></div>
            <svg
              class="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200 shrink-0"
              :class="ticketsOpen ? '' : '-rotate-90'"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <!-- Cards -->
          <div v-show="ticketsOpen" class="space-y-3">
          <div
            v-for="item in ticketResults"
            :key="item.image_id"
            class="rounded-2xl border border-amber-900/30 bg-zinc-900 overflow-hidden"
          >
            <!-- Card header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
              <span class="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {{ (item.confidence * 100).toFixed(0) }}% conf.
              </span>
              <span class="text-[10px] text-zinc-600 font-mono">{{ item.image_id }}</span>
            </div>

            <!-- Ticket body -->
            <div class="p-5 space-y-4">
              <!-- Merchant + ticket meta -->
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Merchant</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ item.data.merchant.name }}</p>
                  <p v-if="item.data.merchant.address" class="text-xs text-zinc-500 mt-0.5 leading-snug">{{ item.data.merchant.address }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Date &amp; Time</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ item.data.ticket.date || '—' }}</p>
                  <p v-if="item.data.ticket.time" class="text-xs text-zinc-500 mt-0.5">{{ item.data.ticket.time }}</p>
                </div>
              </div>

              <!-- Totals row -->
              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Subtotal</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ formatCurrency(item.data.totals.subtotal, item.data.ticket.currency) }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3 text-center">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Tax</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ formatCurrency(item.data.totals.tax, item.data.ticket.currency) }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3 text-center border border-amber-500/20">
                  <p class="text-[10px] text-amber-500/80 mb-1 font-medium uppercase tracking-wider">Total</p>
                  <p class="text-base font-bold text-amber-400">{{ formatCurrency(item.data.totals.total, item.data.ticket.currency) }}</p>
                </div>
              </div>

              <!-- Items table -->
              <div v-if="item.data.items.length" class="rounded-xl bg-zinc-800/60 overflow-hidden">
                <div class="px-4 py-2.5 border-b border-zinc-700/50">
                  <p class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Items ({{ item.data.items.length }})</p>
                </div>
                <ul class="divide-y divide-zinc-700/40">
                  <li
                    v-for="(line, i) in item.data.items"
                    :key="i"
                    class="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>
                      <span class="text-zinc-200 truncate">{{ line.name }}</span>
                      <span class="text-zinc-600 text-xs shrink-0">×{{ line.quantity }}</span>
                    </div>
                    <span class="text-zinc-300 font-semibold tabular-nums shrink-0 ml-3">
                      {{ formatCurrency(line.total_price, item.data.ticket.currency) }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- Warnings -->
              <div v-if="item.data.warnings.length" class="space-y-1">
                <p v-for="(w, i) in item.data.warnings" :key="i" class="text-xs text-amber-400/70 flex items-start gap-1.5">
                  <span class="mt-0.5 shrink-0">⚠</span>{{ w }}
                </p>
              </div>
            </div>
          </div>
          </div><!-- end tickets cards -->
        </div><!-- end tickets section -->

        <!-- ── Vehicles section ─────────────────────────────────────── -->
        <div v-if="vehicleResults.length" class="space-y-3">
          <!-- Collapsible header -->
          <button
            type="button"
            class="w-full flex items-center gap-3 group"
            @click="vehiclesOpen = !vehiclesOpen"
          >
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              Vehicles
              <span class="ml-0.5 text-sky-500/60 font-normal">({{ vehicleResults.length }})</span>
            </span>
            <div class="flex-1 h-px bg-zinc-800 group-hover:bg-zinc-700 transition-colors"></div>
            <svg
              class="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200 shrink-0"
              :class="vehiclesOpen ? '' : '-rotate-90'"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <!-- Cards -->
          <div v-show="vehiclesOpen" class="space-y-3">
          <div
            v-for="item in vehicleResults"
            :key="item.image_id"
            class="rounded-2xl border border-sky-900/30 bg-zinc-900 overflow-hidden"
          >
            <!-- Card header -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
              <span class="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {{ (item.confidence * 100).toFixed(0) }}% conf.
              </span>
              <span class="text-[10px] text-zinc-600 font-mono">{{ item.image_id }}</span>
            </div>

            <!-- Vehicle body -->
            <div class="p-5 space-y-4">
              <!-- License plate hero -->
              <div class="flex items-center justify-center rounded-xl bg-zinc-800/60 border border-sky-500/20 px-6 py-5">
                <p class="text-3xl font-mono font-bold text-sky-300 tracking-[0.25em]">
                  {{ item.data.vehicle.license_plate }}
                </p>
                <span v-if="item.data.vehicle.country" class="ml-3 text-xs font-semibold text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
                  {{ item.data.vehicle.country }}
                </span>
              </div>

              <!-- Vehicle details -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Type</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ item.data.vehicle.vehicle_type || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Brand</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ item.data.vehicle.brand || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Model</p>
                  <p class="text-sm font-semibold text-zinc-100">{{ item.data.vehicle.model || '—' }}</p>
                </div>
                <div class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">Color</p>
                  <p class="text-sm font-semibold text-zinc-100 capitalize">{{ item.data.vehicle.color || '—' }}</p>
                </div>
              </div>

              <!-- Warnings -->
              <div v-if="item.data.warnings.length" class="space-y-1">
                <p v-for="(w, i) in item.data.warnings" :key="i" class="text-xs text-amber-400/70 flex items-start gap-1.5">
                  <span class="mt-0.5 shrink-0">⚠</span>{{ w }}
                </p>
              </div>
            </div>
          </div>
          </div><!-- end vehicles cards -->
        </div><!-- end vehicles section -->

        <!-- ── Unknown / other section ─────────────────────────────── -->
        <div v-if="otherResults.length" class="space-y-3">
          <button
            type="button"
            class="w-full flex items-center gap-3 group"
            @click="othersOpen = !othersOpen"
          >
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-zinc-700/40 text-zinc-400 border border-zinc-700 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              Other
              <span class="ml-0.5 text-zinc-600 font-normal">({{ otherResults.length }})</span>
            </span>
            <div class="flex-1 h-px bg-zinc-800 group-hover:bg-zinc-700 transition-colors"></div>
            <svg
              class="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200 shrink-0"
              :class="othersOpen ? '' : '-rotate-90'"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div v-show="othersOpen" class="space-y-3">
          <div
            v-for="item in otherResults"
            :key="item.image_id"
            class="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden"
          >
            <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
              <span class="text-xs font-semibold text-zinc-400 capitalize">{{ item.type }}</span>
              <span class="text-[10px] text-zinc-600 font-mono">{{ item.image_id }}</span>
            </div>
            <div class="p-5">
              <pre class="text-xs text-zinc-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ JSON.stringify(item.data, null, 2) }}</pre>
            </div>
          </div>
          </div>
        </div>

        <!-- Raw JSON toggle (full response) -->
        <div class="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between px-5 py-3.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            @click="showRaw = !showRaw"
          >
            <span>Raw JSON response</span>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="showRaw ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <Transition name="fade">
            <div v-if="showRaw" class="border-t border-zinc-800 p-5">
              <pre class="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">{{ prettyJson }}</pre>
            </div>
          </Transition>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisResponse } from '~/types/analysis'
import { isTicketResult, isVehicleResult } from '~/types/analysis'

const props = defineProps<{
  result: AnalysisResponse | null
  loading: boolean
  error: string | null
}>()

const showRaw = ref(false)
const ticketsOpen = ref(true)
const vehiclesOpen = ref(true)
const othersOpen = ref(true)

watch(() => props.result, () => {
  showRaw.value = false
  ticketsOpen.value = true
  vehiclesOpen.value = true
  othersOpen.value = true
})

const prettyJson = computed(() =>
  props.result ? JSON.stringify(props.result, null, 2) : '',
)

// ── Grouped result lists ──────────────────────────────────────────────────────

const ticketResults = computed(() =>
  props.result?.results.filter(isTicketResult) ?? [],
)

const vehicleResults = computed(() =>
  props.result?.results.filter(isVehicleResult) ?? [],
)

const otherResults = computed(() =>
  props.result?.results.filter((r) => !isTicketResult(r) && !isVehicleResult(r)) ?? [],
)

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatCurrency(value: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    // Fallback for non-ISO-4217 currency codes (e.g. "RM")
    return `${value.toFixed(2)} ${currency}`
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
</script>
