import type { AuthResponse, Member } from './types'

const KEY = 'library.session'

export interface Session {
  token: string
  expiresAtUtc: string
  member: Member
}

export function saveSession(auth: AuthResponse) {
  try {
    localStorage.setItem(KEY, JSON.stringify(auth))
  } catch {
    // Storage unavailable (private mode): the user just has to log in again after a reload.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Restores the saved login, unless it is missing, unreadable or expired. */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (!s.token || !s.member || new Date(s.expiresAtUtc).getTime() <= Date.now()) {
      clearSession()
      return null
    }
    return s
  } catch {
    return null
  }
}
