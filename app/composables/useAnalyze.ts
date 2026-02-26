/**
 * useAnalyze — composable for image analysis via the vision-agent-sdk.
 *
 * Wraps VisionAgentSDK so pages/components stay clean and all
 * connection details (baseUrl, apiKey) remain in runtimeConfig.
 *
 * Usage:
 *   const { loading, result, error, analyze, reset } = useAnalyze()
 *   await analyze(file)
 *   await analyze([file1, file2])
 */

import { VisionAgentSDK } from 'vision-agent-sdk'
import type { AnalysisResponse } from '~/types/analysis'

export function useAnalyze() {
  const loading = ref(false)
  const result = ref<AnalysisResponse | null>(null)
  const error = ref<string | null>(null)

  async function analyze(files: File | File[]) {
    if (loading.value) return

    loading.value = true
    result.value = null
    error.value = null

    const config = useRuntimeConfig()
    const baseUrl = (config.public.backendUrl as string | undefined)?.replace(/\/$/, '') || ''
    const apiKey = (config.public.sdkApiKey as string | undefined) || ''

    const sdk = new VisionAgentSDK({ apiKey, baseUrl })
    const fileList = Array.isArray(files) ? files : [files]

    try {
      // AnalyzeResponse from the SDK is structurally identical to AnalysisResponse
      result.value = (await sdk.analyzeImages(fileList)) as unknown as AnalysisResponse
    } catch (err: unknown) {
      error.value =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.'
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
