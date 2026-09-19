import { ApiError } from '../api'

export type Notice =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string; status?: number; details?: string[]; correlationId?: string }

/** Turns any thrown value into a notice. 409 gets its own explanation: it is the "someone else got it first" case. */
export function errorNotice(err: unknown, context: string): Notice {
  if (!(err instanceof ApiError)) return { kind: 'error', text: `${context}: unexpected error.` }

  const details = err.fieldErrors ? Object.values(err.fieldErrors).flat() : undefined
  if (err.status === 409) {
    return {
      kind: 'error',
      status: 409,
      text: `${context}: someone else got there first, or the item changed while you were looking. The list has been refreshed. (${err.message})`,
      correlationId: err.correlationId,
    }
  }
  return { kind: 'error', status: err.status, text: `${context}: ${err.message}`, details, correlationId: err.correlationId }
}

export function Banner({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  if (!notice) return null
  const isConflict = notice.kind === 'error' && notice.status === 409
  return (
    <div className={`banner ${notice.kind === 'success' ? 'ok' : isConflict ? 'conflict' : 'bad'}`} role="alert">
      <div>
        {isConflict && <strong>Conflict (409). </strong>}
        {notice.text}
        {notice.kind === 'error' && notice.details && notice.details.length > 0 && (
          <ul>
            {notice.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
        {notice.kind === 'error' && notice.correlationId && (
          <small className="muted"> Reference: {notice.correlationId}</small>
        )}
      </div>
      <button className="link" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
