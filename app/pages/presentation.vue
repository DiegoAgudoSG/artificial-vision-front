<template>
  <div
    class="fixed inset-0 bg-zinc-950 text-white overflow-hidden select-none"
    tabindex="0"
    @keydown="onKey"
    @click="next"
    ref="rootEl"
  >

    <!-- Progress bar -->
    <div class="absolute top-0 left-0 h-0.5 bg-zinc-800 w-full z-20">
      <div
        class="h-full bg-violet-500 transition-all duration-500"
        :style="{ width: `${((currentSlide + 1) / slides.length) * 100}%` }"
      />
    </div>

    <!-- Slide counter -->
    <div class="absolute top-5 right-6 z-20 flex items-center gap-2">
      <span class="text-[11px] font-mono text-zinc-600">{{ currentSlide + 1 }} / {{ slides.length }}</span>
      <div class="flex gap-1">
        <button
          v-for="(_, i) in slides"
          :key="i"
          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          :class="i === currentSlide ? 'bg-violet-400 scale-125' : 'bg-zinc-700 hover:bg-zinc-500'"
          @click.stop="currentSlide = i"
        />
      </div>
    </div>

    <!-- Navigation hint (only first slide) -->
    <Transition name="fade">
      <div
        v-if="currentSlide === 0 && !hasNavigated"
        class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-zinc-600 text-xs animate-bounce"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Click or press → to advance
        <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </div>
    </Transition>

    <!-- Slides -->
    <TransitionGroup :name="transitionName" tag="div" class="w-full h-full">

      <!-- ── SLIDE 0 — Title ──────────────────────────────────────────────── -->
      <div v-if="currentSlide === 0" key="0" class="slide flex flex-col items-center justify-center gap-8 px-12 text-center">
        <!-- Logo mark -->
        <div class="relative">
          <div class="absolute inset-0 blur-3xl bg-violet-600/20 rounded-full scale-150" />
          <div class="relative w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-xl">
            <svg class="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.3" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
        </div>

        <div>
          <h1 class="text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-tight">
            AI Vision Agent
          </h1>
          <p class="mt-4 text-xl text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            Extracción estructurada de datos desde imágenes mediante inteligencia artificial
          </p>
        </div>

        <div class="flex items-center gap-3 text-xs text-zinc-600 font-mono mt-4">
          <span class="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900">Nuxt 4</span>
          <span class="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900">Vue 3</span>
          <span class="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900">TypeScript</span>
          <span class="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900">Firebase</span>
        </div>

        <p class="text-[11px] text-zinc-700 uppercase tracking-widest font-semibold mt-6">Presentación · 26 feb 2026</p>
      </div>

      <!-- ── SLIDE 1 — Demo funcional ────────────────────────────────────── -->
      <div v-if="currentSlide === 1" key="1" class="slide flex flex-col px-16 py-14 gap-10">
        <SlideHeader number="01" label="Demo funcional" color="violet" />

        <div class="grid grid-cols-2 gap-8 flex-1">
          <!-- Upload mode -->
          <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 flex flex-col gap-4">
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-white">Modo Upload</h3>
              <p class="text-sm text-zinc-400 mt-1 leading-relaxed">Arrastra imágenes, captura con cámara o pega una URL. Hasta 3 imágenes por análisis.</p>
            </div>
            <ul class="mt-auto space-y-2">
              <li v-for="item in ['Tickets / recibos → totales e ítems', 'Vehículos → matrícula, marca, modelo', 'Detección de duplicados automática']" :key="item" class="flex items-start gap-2 text-xs text-zinc-400">
                <span class="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1 shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Live mode -->
          <div class="rounded-2xl border border-emerald-900/40 bg-zinc-900/60 p-7 flex flex-col gap-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-white">Modo Live Detection</h3>
              <p class="text-sm text-zinc-400 mt-1 leading-relaxed">Cámara continua con análisis automático cada 750 ms. Historial de detecciones en tabla.</p>
            </div>
            <ul class="mt-auto space-y-2">
              <li v-for="item in ['Thumbnail del frame exacto analizado', 'Toast de notificación no intrusivo', 'Modal de detalle por detección', 'Overlay de bounding box en tiempo real']" :key="item" class="flex items-start gap-2 text-xs text-zinc-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <span class="text-xs text-zinc-500 uppercase tracking-wider font-semibold shrink-0">Live ahora →</span>
          <span class="text-sm text-zinc-300 font-mono">vision-agent.web.app</span>
        </div>
      </div>

      <!-- ── SLIDE 2 — Explicación técnica ──────────────────────────────── -->
      <div v-if="currentSlide === 2" key="2" class="slide flex flex-col px-16 py-14 gap-10">
        <SlideHeader number="02" label="Explicación técnica" color="sky" />

        <div class="grid grid-cols-3 gap-5 flex-1">
          <!-- Pipeline -->
          <div class="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Pipeline de análisis</h3>
            <div class="flex items-center gap-2 flex-wrap">
              <div v-for="(step, i) in pipeline" :key="step.label" class="flex items-center gap-2">
                <div class="flex flex-col items-center gap-1.5">
                  <div class="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2"
                    :class="step.color">
                    <span>{{ step.icon }}</span>
                    {{ step.label }}
                  </div>
                  <span class="text-[9px] text-zinc-600 text-center max-w-[90px] leading-tight">{{ step.detail }}</span>
                </div>
                <svg v-if="i < pipeline.length - 1" class="w-4 h-4 text-zinc-700 shrink-0 mb-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <p class="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-semibold">Detección (Live)</p>
                <ul class="space-y-1.5">
                  <li v-for="item in liveDetails" :key="item" class="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span class="text-sky-500 shrink-0">›</span>{{ item }}
                  </li>
                </ul>
              </div>
              <div>
                <p class="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-semibold">Extracción (Upload)</p>
                <ul class="space-y-1.5">
                  <li v-for="item in uploadDetails" :key="item" class="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span class="text-violet-500 shrink-0">›</span>{{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Prompt / model -->
          <div class="space-y-4">
            <div class="rounded-2xl border border-sky-900/30 bg-zinc-900/60 p-5 h-full space-y-4">
              <h3 class="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Modelo & Prompts</h3>
              <div class="space-y-3">
                <div v-for="card in modelCards" :key="card.label" class="rounded-xl bg-zinc-800/60 px-4 py-3">
                  <p class="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">{{ card.label }}</p>
                  <p class="text-sm font-semibold" :class="card.color">{{ card.value }}</p>
                  <p v-if="card.sub" class="text-[10px] text-zinc-600 mt-0.5">{{ card.sub }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── SLIDE 3 — Arquitectura ──────────────────────────────────────── -->
      <div v-if="currentSlide === 3" key="3" class="slide flex flex-col px-16 py-14 gap-8">
        <SlideHeader number="03" label="Arquitectura" color="amber" />

        <div class="flex-1 grid grid-cols-5 gap-4">
          <!-- User -->
          <div class="col-span-1 flex flex-col items-center justify-center gap-3">
            <div class="w-14 h-14 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
              <svg class="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <span class="text-xs text-zinc-500 text-center font-medium">Usuario<br/>(browser)</span>
          </div>

          <!-- Arrow -->
          <div class="col-span-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-1 w-full">
              <div class="h-px w-full bg-zinc-700" />
              <span class="text-[9px] text-zinc-600 font-mono">HTTPS</span>
            </div>
          </div>

          <!-- Frontend -->
          <div class="col-span-1 flex flex-col gap-2">
            <div class="rounded-2xl border border-violet-900/40 bg-zinc-900 p-4 flex-1 flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <span class="text-[10px] font-bold text-violet-400">N</span>
                </div>
                <span class="text-xs font-semibold text-zinc-300">Nuxt 4 Frontend</span>
              </div>
              <div class="space-y-1.5">
                <div v-for="c in frontendComponents" :key="c" class="text-[10px] text-zinc-500 bg-zinc-800 rounded-lg px-2 py-1 font-mono">{{ c }}</div>
              </div>
              <div class="mt-auto pt-2 border-t border-zinc-800">
                <span class="text-[9px] text-zinc-600">Firebase Hosting</span>
              </div>
            </div>
          </div>

          <!-- Arrow + SDK -->
          <div class="col-span-1 flex flex-col items-center justify-center gap-2">
            <div class="flex flex-col items-center gap-1 w-full">
              <div class="h-px w-full bg-zinc-700" />
              <span class="text-[9px] text-zinc-600 font-mono">vision-agent-sdk</span>
              <span class="text-[9px] text-zinc-600 font-mono">multipart POST</span>
            </div>
          </div>

          <!-- Backend + AI -->
          <div class="col-span-1 flex flex-col gap-2">
            <div class="rounded-2xl border border-sky-900/40 bg-zinc-900 p-4 flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 6 0m-6 0H3m16.5 0a3 3 0 0 0 3-3m-3 3a3 3 0 1 1-6 0m6 0h1.5" />
                  </svg>
                </div>
                <span class="text-xs font-semibold text-zinc-300">Backend API</span>
              </div>
              <div class="space-y-1.5">
                <div v-for="c in backendComponents" :key="c" class="text-[10px] text-zinc-500 bg-zinc-800 rounded-lg px-2 py-1 font-mono">{{ c }}</div>
              </div>
            </div>
            <div class="rounded-2xl border border-amber-900/30 bg-zinc-900 p-3 flex items-center gap-2">
              <span class="text-lg">🤖</span>
              <div>
                <p class="text-xs font-semibold text-zinc-300">Modelo IA</p>
                <p class="text-[10px] text-zinc-600">Vision + NLP</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Data flow note -->
        <div class="grid grid-cols-3 gap-4">
          <div v-for="flow in dataFlows" :key="flow.label" class="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3">
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">{{ flow.label }}</p>
            <p class="text-xs text-zinc-300 font-mono">{{ flow.value }}</p>
          </div>
        </div>
      </div>

      <!-- ── SLIDE 4 — Escalabilidad ─────────────────────────────────────── -->
      <div v-if="currentSlide === 4" key="4" class="slide flex flex-col px-16 py-14 gap-10">
        <SlideHeader number="04" label="Escalabilidad" color="emerald" />

        <div class="grid grid-cols-3 gap-5 flex-1">
          <div
            v-for="pillar in scalabilityPillars"
            :key="pillar.title"
            class="rounded-2xl border bg-zinc-900/60 p-6 flex flex-col gap-4"
            :class="pillar.border"
          >
            <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl border" :class="pillar.iconBg">
              {{ pillar.icon }}
            </div>
            <div>
              <h3 class="font-semibold text-base text-white">{{ pillar.title }}</h3>
              <p class="text-sm text-zinc-400 mt-1 leading-relaxed">{{ pillar.desc }}</p>
            </div>
            <ul class="mt-auto space-y-2">
              <li v-for="item in pillar.items" :key="item" class="flex items-start gap-2 text-xs text-zinc-400">
                <span class="mt-0.5 shrink-0" :class="pillar.dot">●</span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Metrics row -->
        <div class="grid grid-cols-4 gap-4">
          <div v-for="metric in metrics" :key="metric.label" class="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-center">
            <p class="text-2xl font-bold" :class="metric.color">{{ metric.value }}</p>
            <p class="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5 font-semibold">{{ metric.label }}</p>
          </div>
        </div>
      </div>

      <!-- ── SLIDE 5 — Próximos pasos ────────────────────────────────────── -->
      <div v-if="currentSlide === 5" key="5" class="slide flex flex-col px-16 py-14 gap-10">
        <SlideHeader number="05" label="Próximos pasos" color="rose" />

        <div class="grid grid-cols-2 gap-6 flex-1">
          <!-- Short term -->
          <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">Corto plazo</span>
              <span class="text-[10px] text-zinc-600">3 – 6 meses</span>
            </div>
            <ul class="space-y-3">
              <li v-for="item in shortTerm" :key="item.text" class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">{{ item.icon }}</div>
                <div>
                  <p class="text-sm font-medium text-zinc-200">{{ item.text }}</p>
                  <p class="text-[11px] text-zinc-500 mt-0.5">{{ item.sub }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Long term -->
          <div class="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">Largo plazo</span>
              <span class="text-[10px] text-zinc-600">6 – 18 meses</span>
            </div>
            <ul class="space-y-3">
              <li v-for="item in longTerm" :key="item.text" class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm shrink-0">{{ item.icon }}</div>
                <div>
                  <p class="text-sm font-medium text-zinc-200">{{ item.text }}</p>
                  <p class="text-[11px] text-zinc-500 mt-0.5">{{ item.sub }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- CTA -->
        <div class="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-8 py-5 flex items-center justify-between">
          <div>
            <p class="font-semibold text-white">¿Si se convierte en producto real?</p>
            <p class="text-sm text-zinc-400 mt-0.5">Modelo SaaS B2B con facturación por API calls · Integraciones ERP/CRM · App móvil nativa</p>
          </div>
          <div class="shrink-0 w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">🚀</div>
        </div>
      </div>

    </TransitionGroup>

    <!-- Prev / Next buttons -->
    <button
      v-if="currentSlide > 0"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
      @click.stop="prev"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
    <button
      v-if="currentSlide < slides.length - 1"
      class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
      @click.stop="next"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>

  </div>
</template>

<script setup lang="ts">
// ── Meta ──────────────────────────────────────────────────────────────────────

useHead({ title: 'AI Vision Agent — Presentación' })

// ── Slide navigation ──────────────────────────────────────────────────────────

const slides = Array.from({ length: 6 })
const currentSlide = ref(0)
const hasNavigated = ref(false)
const transitionName = ref('slide-left')

const rootEl = ref<HTMLElement | null>(null)
onMounted(() => { rootEl.value?.focus() })

function next() {
  if (currentSlide.value < slides.length - 1) {
    transitionName.value = 'slide-left'
    currentSlide.value++
    hasNavigated.value = true
  }
}

function prev() {
  if (currentSlide.value > 0) {
    transitionName.value = 'slide-right'
    currentSlide.value--
  }
}

function onKey(e: KeyboardEvent) {
  if (['ArrowRight', 'ArrowDown', 'Space', ' '].includes(e.key)) { e.preventDefault(); next() }
  if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); prev() }
}

// ── Slide 2 data ──────────────────────────────────────────────────────────────

const pipeline = [
  { label: 'Captura', icon: '📷', detail: 'Frame JPEG / imagen subida', color: 'bg-zinc-800 border-zinc-700 text-zinc-300' },
  { label: 'SDK', icon: '📦', detail: 'multipart/form-data POST', color: 'bg-violet-500/10 border-violet-500/30 text-violet-300' },
  { label: 'POST /analyze', icon: '🌐', detail: 'Backend REST API', color: 'bg-sky-500/10 border-sky-500/30 text-sky-300' },
  { label: 'AI Model', icon: '🤖', detail: 'Vision + NLP inference', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' },
  { label: 'JSON', icon: '✅', detail: 'AnalysisResponse tipado', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
]

const liveDetails = [
  'Loop 750 ms, guard anti-concurrencia',
  'Threshold confianza ≥ 0.5',
  'Cooldown 4 s tras detección positiva',
  'Thumbnail capturado ANTES del POST',
]

const uploadDetails = [
  'Hasta 3 imágenes por batch',
  'Tipos: ticket · vehicle · unknown',
  'Desglose de impuestos por línea',
  'Moneda inferida con flag de aviso',
]

const modelCards = [
  { label: 'Endpoint', value: 'POST /analyze', color: 'text-zinc-200', sub: 'multipart/form-data' },
  { label: 'Input', value: 'JPEG · PNG · WEBP', color: 'text-sky-300', sub: 'hasta 3 imágenes' },
  { label: 'Output', value: 'AnalysisResponse', color: 'text-emerald-300', sub: 'JSON tipado + confidence' },
]

// ── Slide 3 data ──────────────────────────────────────────────────────────────

const frontendComponents = ['ImageUploader.vue', 'LiveDetector.vue', 'ResultViewer.vue', 'useLiveDetection.ts', 'useCamera.ts', 'useAnalyze.ts']
const backendComponents = ['POST /analyze', 'Auth Bearer', 'JSON response']
const dataFlows = [
  { label: 'Auth', value: 'Authorization: Bearer {SDK_API_KEY}' },
  { label: 'Request', value: 'multipart/form-data · field: images[]' },
  { label: 'Response', value: '{ meta, summary, results[] }' },
]

// ── Slide 4 data ──────────────────────────────────────────────────────────────

const scalabilityPillars = [
  {
    icon: '⚡',
    title: 'Rendimiento',
    desc: 'Arquitectura stateless que escala horizontalmente sin cambios.',
    border: 'border-sky-900/40',
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    dot: 'text-sky-500',
    items: ['Firebase Hosting CDN global', 'SDK sin dependencias (bundle ~4 kB)', 'SSG-compatible, hidratación mínima'],
  },
  {
    icon: '🏗️',
    title: 'Extensibilidad',
    desc: 'Diseño modular que permite añadir nuevos tipos de análisis sin tocar el frontend.',
    border: 'border-violet-900/40',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    dot: 'text-violet-500',
    items: ['Tipo "unknown" → base para nuevos modelos', 'SDK versionado e independiente del frontend', 'Composables desacoplados y testeables'],
  },
  {
    icon: '💰',
    title: 'Viabilidad',
    desc: 'Modelo de negocio claro desde el primer día.',
    border: 'border-emerald-900/40',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'text-emerald-500',
    items: ['Precio por API call (pay-as-you-go)', 'Planes por volumen para empresas', 'Cero infraestructura fija inicial'],
  },
]

const metrics = [
  { value: '<800ms', label: 'Latencia típica', color: 'text-sky-400' },
  { value: '0', label: 'Dependencias SDK', color: 'text-emerald-400' },
  { value: '∞', label: 'Tipos de imagen', color: 'text-violet-400' },
  { value: '100%', label: 'TypeScript', color: 'text-amber-400' },
]

// ── Slide 5 data ──────────────────────────────────────────────────────────────

const shortTerm = [
  { icon: '🔐', text: 'Autenticación de usuarios', sub: 'Login, workspaces, historial persistente' },
  { icon: '📊', text: 'Dashboard de analytics', sub: 'Gráficas de gasto, detecciones por day/week' },
  { icon: '🔔', text: 'Alertas configurables', sub: 'Webhook / email al detectar matrículas concretas' },
  { icon: '📱', text: 'PWA con notificaciones push', sub: 'Instalable en móvil, modo offline básico' },
]

const longTerm = [
  { icon: '🔗', text: 'Integraciones ERP / CRM', sub: 'Exportar a SAP, Salesforce, Odoo automáticamente' },
  { icon: '🌍', text: 'API pública con marketplace', sub: 'Developers pueden publicar modelos custom' },
  { icon: '🤝', text: 'White-label para flotas', sub: 'Plataforma de control de accesos para parkings' },
  { icon: '🧠', text: 'Fine-tuning propio', sub: 'Modelo especializado con datos de clientes' },
]
</script>

<!-- ── Slide component ──────────────────────────────────────────────────────── -->
<script lang="ts">
// Inline sub-component so we don't need a separate file
const SlideHeader = defineComponent({
  props: {
    number: String,
    label: String,
    color: {
      type: String,
      default: 'violet',
    },
  },
  setup(props) {
    const colorMap: Record<string, string> = {
      violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      sky:    'text-sky-400 bg-sky-500/10 border-sky-500/20',
      amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
      emerald:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
    }
    const cls = computed(() => colorMap[props.color ?? 'violet'] ?? colorMap.violet)
    return { cls }
  },
  template: `
    <div class="flex items-center gap-3">
      <span class="font-mono text-xs font-bold text-zinc-700">{{ number }}</span>
      <h2 class="text-3xl font-bold tracking-tight text-white">{{ label }}</h2>
      <div class="flex-1 h-px bg-zinc-800 ml-2" />
      <span class="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border" :class="cls">20 min</span>
    </div>
  `,
})
</script>

<style scoped>
.slide {
  position: absolute;
  inset: 0;
  padding-top: 3.5rem;
}

/* Left (forward) transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.slide-left-enter-from { transform: translateX(60px); opacity: 0; }
.slide-left-leave-to   { transform: translateX(-60px); opacity: 0; }

/* Right (backward) transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.slide-right-enter-from { transform: translateX(-60px); opacity: 0; }
.slide-right-leave-to   { transform: translateX(60px); opacity: 0; }

/* Fade for nav hint */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
