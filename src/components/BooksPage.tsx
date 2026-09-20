import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api, type BookInput } from '../api'
import type { Book, BookFilters, BookSort, Member, Paged } from '../types'
import { Banner, errorNotice, type Notice } from './Banner'
import { Pager } from './Pager'

export function BooksPage({ me }: { me: Member }) {
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    availableOnly: false,
    sortBy: 'Title',
    desc: false,
    page: 1,
    pageSize: 5,
  })
  const [searchText, setSearchText] = useState('')
  const [data, setData] = useState<Paged<Book> | null>(null)
  const [loading, setLoading] = useState(true)
  const [borrowingId, setBorrowingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const isAdmin = me.role === 'Admin'
  const [newBook, setNewBook] = useState<BookInput>({ title: '', author: '', isbn: '', totalCopies: 1 })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.listBooks(filters))
    } catch (err) {
      setNotice(errorNotice(err, 'Could not load books'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void load()
  }, [load])

  function update(patch: Partial<BookFilters>) {
    setFilters((f) => ({ ...f, page: 1, ...patch }))
  }

  function onSearch(e: FormEvent) {
    e.preventDefault()
    update({ search: searchText })
  }

  async function borrow(book: Book) {
    setBorrowingId(book.id)
    setNotice(null)
    try {
      await api.borrow(book.id, me.id)
      setNotice({ kind: 'success', text: `You borrowed “${book.title}”.` })
    } catch (err) {
      // 409 means the last copy went to someone else between loading the list and clicking.
      setNotice(errorNotice(err, `Could not borrow “${book.title}”`))
    } finally {
      setBorrowingId(null)
      await load() // Always refresh: the server is the source of truth for how many copies are left.
    }
  }

  async function addBook(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      await api.createBook(newBook)
      setNotice({ kind: 'success', text: `Added “${newBook.title}”.` })
      setNewBook({ title: '', author: '', isbn: '', totalCopies: 1 })
      await load()
    } catch (err) {
      setNotice(errorNotice(err, 'Could not add the book'))
    } finally {
      setSaving(false)
    }
  }

  async function removeBook(book: Book) {
    if (!window.confirm(`Delete “${book.title}”?`)) return
    setNotice(null)
    try {
      await api.deleteBook(book.id)
      setNotice({ kind: 'success', text: `Deleted “${book.title}”.` })
    } catch (err) {
      setNotice(errorNotice(err, `Could not delete “${book.title}”`))
    } finally {
      await load()
    }
  }

  return (
    <section>
      <Banner notice={notice} onClose={() => setNotice(null)} />

      {isAdmin && (
        <form className="toolbar" onSubmit={addBook}>
          <input placeholder="Title" required value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} />
          <input placeholder="Author" required value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} />
          <input placeholder="ISBN (10-20 chars)" required minLength={10} maxLength={20} value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} />
          <label className="inline">
            Copies
            <input type="number" min={0} max={1000} required value={newBook.totalCopies} onChange={(e) => setNewBook({ ...newBook, totalCopies: Number(e.target.value) })} />
          </label>
          <button className="primary" disabled={saving}>{saving ? 'Adding…' : 'Add book'}</button>
        </form>
      )}

      <form className="toolbar" onSubmit={onSearch}>
        <input
          placeholder="Search title, author or ISBN"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button>Search</button>
        <label className="inline">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => update({ availableOnly: e.target.checked })}
          />
          Available only
        </label>
        <label className="inline">
          Sort
          <select value={filters.sortBy} onChange={(e) => update({ sortBy: e.target.value as BookSort })}>
            <option value="Title">Title</option>
            <option value="Author">Author</option>
            <option value="Availability">Availability</option>
          </select>
        </label>
        <label className="inline">
          <input type="checkbox" checked={filters.desc} onChange={(e) => update({ desc: e.target.checked })} />
          Descending
        </label>
      </form>

      {loading && !data ? (
        <p className="muted">Loading…</p>
      ) : data && data.items.length === 0 ? (
        <p className="muted">No books match.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Copies</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.title}
                  <div className="muted small">{b.isbn}</div>
                </td>
                <td>{b.author}</td>
                <td>
                  <span className={b.availableCopies === 0 ? 'pill out' : 'pill'}>
                    {b.availableCopies} / {b.totalCopies} available
                  </span>
                </td>
                <td>
                  <button
                    className="primary"
                    onClick={() => borrow(b)}
                    disabled={b.availableCopies === 0 || borrowingId !== null}
                  >
                    {borrowingId === b.id ? 'Borrowing…' : 'Borrow'}
                  </button>
                  {isAdmin && (
                    <button className="link" onClick={() => removeBook(b)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && (
        <Pager
          page={data.page}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          onPage={(page) => setFilters((f) => ({ ...f, page }))}
        />
      )}
    </section>
  )
}
