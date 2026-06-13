import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDSyWaLtKXa9qve42c3L9sAZ7Mw0KuMdR8',
  authDomain: 'samssweet.firebaseapp.com',
  projectId: 'samssweet',
  storageBucket: 'samssweet.firebasestorage.app',
  messagingSenderId: '962904517776',
  appId: '1:962904517776:web:da9f6e0a5a3fcbbcea3c15',
  measurementId: 'G-698LHXPQC8',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
