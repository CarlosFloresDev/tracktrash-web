import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import clsx from 'clsx'
import { Star } from 'lucide-react'
import { labels, type RequestStatus, type VerificationStatus } from '@/api/enums'
import { formatDateTime } from '@/lib/format'
import { Badge, Card } from './primitives'
import { ErrorState, ListSkeleton } from './feedback'

const statusTone = { Pending: 'amber', Assigned: 'blue', InProgress: 'sand', Completed: 'green', Cancelled: 'red' } as const

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={statusTone[status]}>{labels.status[status]}</Badge>
}

const verificationTone = { Pending: 'amber', Verified: 'green', Rejected: 'red' } as const

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge tone={verificationTone[status]}>{labels.verification[status]}</Badge>
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'green',
}: {
  label: string
  value: string
  icon: ReactNode
  hint?: string
  tone?: 'green' | 'sand' | 'blue' | 'lime'
}) {
  const toneClass = {
    green: 'bg-leaf-100 text-leaf-600',
    sand: 'bg-sillar-100 text-sillar-600',
    blue: 'bg-info-50 text-info-600',
    lime: 'bg-lime-300 text-pine-900',
  }[tone]
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={clsx('grid size-11 place-items-center rounded-xl [&>svg]:size-5', toneClass)}>{icon}</span>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tabular-nums text-pine-900">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </Card>
  )
}

export function Rating({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const rounded = Math.round(value)
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={clsx(size === 'sm' ? 'size-3.5' : 'size-4', index < rounded ? 'fill-lime-300 text-leaf-600' : 'text-line')}
        />
      ))}
    </span>
  )
}

export function RatingInput({ value, onChange }: { value: number; onChange: (score: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Calificacion" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${score} ${score === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(score)}
          className="rounded-md p-1 hover:bg-leaf-50"
        >
          <Star className={clsx('size-7', score <= value ? 'fill-lime-300 text-leaf-600' : 'text-line')} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export interface TimelineEntry {
  id: number
  title: string
  detail?: string | null
  at: string
  status: RequestStatus
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-leaf-100 pl-6">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative">
          <span
            className={clsx(
              'absolute -left-[1.95rem] top-1 size-3 rounded-full ring-4 ring-white',
              index === entries.length - 1 ? 'bg-leaf-600' : 'bg-leaf-400',
            )}
          />
          <p className="text-sm font-semibold text-ink">{entry.title}</p>
          {entry.detail && <p className="text-sm text-muted">{entry.detail}</p>}
          <time className="text-xs text-muted" dateTime={entry.at}>
            {formatDateTime(entry.at)}
          </time>
        </li>
      ))}
    </ol>
  )
}

/** Renders the loading and error states of a query and hands the data to `children` once it is ready. */
export function QueryBoundary<T>({
  query,
  rows,
  children,
}: {
  query: UseQueryResult<T>
  rows?: number
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <ListSkeleton rows={rows} />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  return <>{children(query.data)}</>
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            {head.map((title) => (
              <th key={title} scope="col" className="px-5 py-3 font-semibold">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}
