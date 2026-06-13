import { useState, type FormEvent } from 'react'
import { signIn } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold text-cocoa">Admin Login</h1>
        <label className="block">
          <span className="text-sm text-cocoa/70">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-cocoa/70">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full border border-caramel/40 rounded px-3 py-2"
          />
        </label>
        {error && <p className="text-berry text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-2 rounded bg-cocoa text-cream font-semibold disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  )
}
