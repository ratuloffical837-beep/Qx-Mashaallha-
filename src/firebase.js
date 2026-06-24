import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyChYNS0363dMysBjOshDrVXU4lFzqGFxo4",
  authDomain:        "qutex-massaallah.firebaseapp.com",
  projectId:         "qutex-massaallah",
  storageBucket:     "qutex-massaallah.firebasestorage.app",
  messagingSenderId: "317798520655",
  appId:             "1:317798520655:web:73e942ad119bd8c3f7d73a",
  measurementId:     "G-BDY9S0V7YE",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
