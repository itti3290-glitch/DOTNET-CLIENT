/** Server-side paging: this only shows the position and asks the parent for another page. */
export function Pager({
  page,
  totalPages,
  totalCount,
  onPage,
}: {
  page: number
  totalPages: number
  totalCount: number
  onPage: (page: number) => void
}) {
  return (
    <div className="pager">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}>
        ← Previous
      </button>
      <span>
        Page {page} of {Math.max(totalPages, 1)} · {totalCount} total
      </span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </div>
  )
}
