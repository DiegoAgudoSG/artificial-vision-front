import type { Analytics } from 'firebase/analytics'
import type { FirebaseApp } from 'firebase/app'

export function useFirebase() {
  const { $firebaseApp, $analytics } = useNuxtApp()
  return {
    app: $firebaseApp as FirebaseApp,
    analytics: $analytics as Analytics,
  }
}
