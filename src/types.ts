// Shapes returned by the Library API (camelCase JSON, enums as strings).

export type Role = 'Admin' | 'Member'

export interface Member {
  id: number
  fullName: string
  email: string
  role: Role
}

export interface AuthResponse {
  token: string
  expiresAtUtc: string
  member: Member
}

export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  totalCopies: number
  availableCopies: number
  categories: string[]
}

export interface Loan {
  id: number
  bookId: number
  bookTitle: string
  memberId: number
  memberName: string
  loanedAt: string
  returnedAt: string | null
  status: 'Active' | 'Returned'
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type BookSort = 'Title' | 'Author' | 'Availability'

export interface BookFilters {
  search: string
  availableOnly: boolean
  sortBy: BookSort
  desc: boolean
  page: number
  pageSize: number
}
