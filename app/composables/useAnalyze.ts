/**
 * useAnalyze — composable for image analysis.
 *
 * Encapsulates all reactive state and the POST /api/analyze call so
 * pages/components stay clean.
 *
 * Accepts a single File or an array of Files. Multiple images are sent in one
 * batch request and the full AnalysisResponse is stored in `result`.
 *
 * Usage:
 *   const { loading, result, error, analyze, reset } = useAnalyze()
 *   await analyze(file)
 *   await analyze([file1, file2])
 */

import type { AnalysisResponse } from '~/types/analysis'

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
  const result = ref<AnalysisResponse | null>(null)
  const error = ref<string | null>(null)

  /**
   * Send one or more images to the backend for analysis.
   * Each file is appended under the `images` key so the backend
   * receives a standard multipart/form-data batch request.
   */
  async function analyze(files: File | File[]) {
    if (loading.value) return

    loading.value = true
    result.value = null
    error.value = null

    const config = useRuntimeConfig()
    const base = (config.public.backendUrl as string | undefined) || ''
    const backendUrl = base.replace(/\/$/, '') || '/api/analyze'

    try {
      const formData = new FormData()
      const fileList = Array.isArray(files) ? files : [files]
      for (const file of fileList) {
        formData.append('images', file)
      }

      result.value = await $fetch<AnalysisResponse>(`${backendUrl}/api/analyze`, {
        method: 'POST',
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
