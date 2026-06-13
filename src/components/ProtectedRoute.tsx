import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import Login from './Login'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <main className="p-8 text-cocoa/70">Loading…</main>
  }
  if (!user) {
    return <Login />
  }
  return <>{children}</>
}
