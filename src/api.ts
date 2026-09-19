import type { AuthResponse, Book, BookFilters, Loan, Member, Paged } from './types'

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5188'

/** Error from the API. Every server error has the same JSON shape: status, error, message, correlationId (+ errors for 400). */
export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>
  correlationId?: string

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>, correlationId?: string) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.correlationId = correlationId
  }
}

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setToken(value: string | null) {
  token = value
}

/** Called when a request made with a token comes back 401 (expired or invalid token). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

const DEFAULT_MESSAGES: Record<number, string> = {
  401: 'You are not logged in, or your session has expired.',
  403: 'You do not have permission to do that.',
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, `Cannot reach the server at ${BASE_URL}. Is the API running?`)
  }

  if (response.status === 204) return undefined as T

  // 401/403 produced by the JWT middleware have an empty body.
  const text = await response.text()
  let data: Record<string, unknown> | null = null
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    data = null
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.()
    const message =
      (typeof data?.message === 'string' && data.message) ||
      DEFAULT_MESSAGES[response.status] ||
      `Request failed (${response.status}).`
    throw new ApiError(
      response.status,
      message,
      data?.errors as Record<string, string[]> | undefined,
      (typeof data?.correlationId === 'string' ? data.correlationId : undefined) ??
        response.headers.get('X-Correlation-Id') ??
        undefined,
    )
  }

  return data as T
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export const api = {
  login: (email: string, password: string) => post<AuthResponse>('/api/auth/login', { email, password }),

  register: (fullName: string, email: string, password: string) =>
    post<Member>('/api/auth/register', { fullName, email, password }),

  listBooks: (f: BookFilters) => {
    const q = new URLSearchParams({
      sortBy: f.sortBy,
      desc: String(f.desc),
      availableOnly: String(f.availableOnly),
      page: String(f.page),
      pageSize: String(f.pageSize),
    })
    if (f.search.trim()) q.set('search', f.search.trim())
    return request<Paged<Book>>(`/api/books?${q}`)
  },

  /** Borrow one copy: POST /api/loans. 409 when the last copy was just taken by someone else. */
  borrow: (bookId: number, memberId: number) => post<Loan>('/api/loans', { bookId, memberId }),

  /** Members see their own active loans, admins see everyone's. */
  listActiveLoans: (page: number, pageSize: number) =>
    request<Paged<Loan>>(`/api/loans/active?page=${page}&pageSize=${pageSize}`),

  returnLoan: (loanId: number) => post<Loan>(`/api/loans/${loanId}/return`),
}
