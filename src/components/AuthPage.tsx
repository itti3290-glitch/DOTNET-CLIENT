import { useState, type FormEvent } from 'react'
import { api } from '../api'
import type { AuthResponse } from '../types'
import { Banner, errorNotice, type Notice } from './Banner'

export function AuthPage({ onLoggedIn }: { onLoggedIn: (auth: AuthResponse) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      if (mode === 'register') await api.register(fullName, email, password)
      // Registering does not log you in, so log in with the same credentials afterwards.
      onLoggedIn(await api.login(email, password))
    } catch (err) {
      setNotice(errorNotice(err, mode === 'login' ? 'Login failed' : 'Registration failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="card narrow">
      <h1>Library</h1>
      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
          Log in
        </button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
          Register
        </button>
      </div>

      <Banner notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        <button className="primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      {mode === 'login' && (
        <p className="muted">
          Demo: <code>admin@library.local</code> / <code>Admin123!</code>
        </p>
      )}
    </main>
  )
}
