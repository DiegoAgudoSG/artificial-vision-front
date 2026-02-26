import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyAXVOPBhlhpnxL-0LN8RGlxLLOXHGsAjfA',
  authDomain: 'artificial-vision-36aed.firebaseapp.com',
  projectId: 'artificial-vision-36aed',
  storageBucket: 'artificial-vision-36aed.firebasestorage.app',
  messagingSenderId: '1024735346959',
  appId: '1:1024735346959:web:324856128d50bbb359be7a',
  measurementId: 'G-ZL4LHS89GY',
}

export default defineNuxtPlugin(() => {
  const app = initializeApp(firebaseConfig)
  const analytics = getAnalytics(app)

  return {
    provide: {
      firebaseApp: app,
      analytics,
    },
  }
})
