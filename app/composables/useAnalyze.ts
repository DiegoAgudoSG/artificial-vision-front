/**
 * useAnalyze — composable for image analysis.
 *
 * Encapsulates all reactive state and the POST /api/analyze call so
 * pages/components stay clean.
 *
 * Usage:
 *   const { loading, result, error, analyze, reset } = useAnalyze()
 */

export interface AnalysisResult {
  type?: string
  // Receipt fields
  store?: string
  date?: string
  total?: string | number
  items?: unknown[]
  // Vehicle fields
  license_plate?: string
  vehicle_type?: string
  color?: string
  make?: string
  model?: string
  // Generic catch-all
  [key: string]: unknown
}

interface FetchError {
  data?: { statusMessage?: string; message?: string }
  status?: number
  message?: string
}

function isFetchError(err: unknown): err is FetchError {
  return typeof err === 'object' && err !== null && 'status' in err
}

export function useAnalyze() {
  const loading = ref(false)
  const result = ref<AnalysisResult | null>(null)
  const error = ref<string | null>(null)

  async function analyze(file: File) {
    if (loading.value) return

    loading.value = true
    result.value = null
    error.value = null

    const config = useRuntimeConfig()
    const base = (config.public.backendUrl as string | undefined) || ''
    const backendUrl = base.replace(/\/$/, '') || '/api/analyze'

    try {
      const formData = new FormData()
      formData.append('image', file)

      result.value = await $fetch<AnalysisResult>(`${backendUrl}/health`, {
        method: 'GET',
        body: formData,
      })
    } catch (err: unknown) {
      if (isFetchError(err)) {
        error.value =
          err.data?.statusMessage ??
          err.data?.message ??
          `Request failed with status ${err.status ?? 'unknown'}`
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  function reset() {
    loading.value = false
    result.value = null
    error.value = null
  }

  return {
    loading: readonly(loading),
    result: readonly(result),
    error: readonly(error),
    analyze,
    reset,
  }
}
