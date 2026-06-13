import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

export function signIn(email: string, password: string): Promise<unknown> {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser(): Promise<void> {
  return signOut(auth)
}

export function subscribeAuth(onChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onChange)
}
