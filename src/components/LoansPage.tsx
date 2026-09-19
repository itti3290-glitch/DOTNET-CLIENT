import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import type { Loan, Member, Paged } from '../types'
import { Banner, errorNotice, type Notice } from './Banner'
import { Pager } from './Pager'

export function LoansPage({ me }: { me: Member }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Paged<Loan> | null>(null)
  const [loading, setLoading] = useState(true)
  const [returningId, setReturningId] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.listActiveLoans(page, 5))
    } catch (err) {
      setNotice(errorNotice(err, 'Could not load loans'))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  async function giveBack(loan: Loan) {
    setReturningId(loan.id)
    setNotice(null)
    try {
      await api.returnLoan(loan.id)
      setNotice({ kind: 'success', text: `“${loan.bookTitle}” was returned.` })
    } catch (err) {
      setNotice(errorNotice(err, `Could not return “${loan.bookTitle}”`))
    } finally {
      setReturningId(null)
      await load()
    }
  }

  return (
    <section>
      <Banner notice={notice} onClose={() => setNotice(null)} />
      <p className="muted">{me.role === 'Admin' ? 'All active loans.' : 'Your active loans.'}</p>

      {loading && !data ? (
        <p className="muted">Loading…</p>
      ) : data && data.items.length === 0 ? (
        <p className="muted">Nothing on loan.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th>
              {me.role === 'Admin' && <th>Member</th>}
              <th>Borrowed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((l) => (
              <tr key={l.id}>
                <td>{l.bookTitle}</td>
                {me.role === 'Admin' && <td>{l.memberName}</td>}
                <td>{new Date(l.loanedAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => giveBack(l)} disabled={returningId !== null}>
                    {returningId === l.id ? 'Returning…' : 'Return'}
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
