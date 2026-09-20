import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import type { Member, Paged } from '../types'
import { Banner, errorNotice, type Notice } from './Banner'
import { Pager } from './Pager'

/** Admin only: list members, add a new member, delete a member. */
export function MembersPage({ me }: { me: Member }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paged<Member> | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await api.listMembers(page, 10))
    } catch (err) {
      setNotice(errorNotice(err, 'Could not load members'))
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      await api.register(form.fullName, form.email, form.password)
      setNotice({ kind: 'success', text: `Added ${form.fullName}.` })
      setForm({ fullName: '', email: '', password: '' })
      await load()
    } catch (err) {
      setNotice(errorNotice(err, 'Could not add the member'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(m: Member) {
    if (!window.confirm(`Delete ${m.fullName} (${m.email})?`)) return
    setNotice(null)
    try {
      await api.deleteMember(m.id)
      setNotice({ kind: 'success', text: `Deleted ${m.fullName}.` })
    } catch (err) {
      setNotice(errorNotice(err, `Could not delete ${m.fullName}`))
    } finally {
      await load()
    }
  }

  return (
    <section>
      <Banner notice={notice} onClose={() => setNotice(null)} />

      <form className="toolbar" onSubmit={add}>
        <input placeholder="Full name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password (min 8)" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="primary" disabled={saving}>{saving ? 'Adding…' : 'Add member'}</button>
      </form>

      {!data ? (
        <p className="muted">Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((m) => (
              <tr key={m.id}>
                <td>{m.fullName}</td>
                <td>{m.email}</td>
                <td>
                  <span className="pill">{m.role}</span>
                </td>
                <td>
                  <button className="link" onClick={() => remove(m)} disabled={m.id === me.id}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && <Pager page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPage={setPage} />}
    </section>
  )
}
