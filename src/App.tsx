import { useCallback, useEffect, useState } from 'react'
import { setToken, setUnauthorizedHandler } from './api'
import { AuthPage } from './components/AuthPage'
import { BooksPage } from './components/BooksPage'
import { LoansPage } from './components/LoansPage'
import { clearSession, loadSession, saveSession, type Session } from './session'
import type { AuthResponse } from './types'

// Read once at startup; also puts the token on the API client so a page refresh keeps you logged in.
function initialSession(): Session | null {
  const s = loadSession()
  setToken(s?.token ?? null)
  return s
}

export default function App() {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [tab, setTab] = useState<'books' | 'loans'>('books')
  const [expired, setExpired] = useState(false)

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setSession(null)
  }, [])

  // A 401 with a token means it expired or was rejected: go back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      setExpired(true)
    })
    return () => setUnauthorizedHandler(null)
  }, [logout])

  function onLoggedIn(auth: AuthResponse) {
    saveSession(auth)
    setToken(auth.token)
    setSession(auth)
    setTab('books')
    setExpired(false)
  }

  if (!session) {
    return (
      <>
        {expired && <p className="banner bad">Your session expired. Please log in again.</p>}
        <AuthPage onLoggedIn={onLoggedIn} />
      </>
    )
  }

  const me = session.member
  return (
    <div className="app">
      <header>
        <h1>Library</h1>
        <nav className="tabs">
          <button className={tab === 'books' ? 'active' : ''} onClick={() => setTab('books')}>
            Books
          </button>
          <button className={tab === 'loans' ? 'active' : ''} onClick={() => setTab('loans')}>
            {me.role === 'Admin' ? 'Active loans' : 'My loans'}
          </button>
        </nav>
        <div className="who">
          {me.fullName} <span className="pill">{me.role}</span>
          <button className="link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {tab === 'books' ? <BooksPage me={me} /> : <LoansPage me={me} />}
    </div>
  )
}
