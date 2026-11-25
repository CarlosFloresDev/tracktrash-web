import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Search, X } from 'lucide-react'

/** Lowercases and strips accents so "Cayma" matches "cayma" and "Cartón" matches "carton". */
export function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** True when every word of the query appears in at least one of the fields. */
export function matchesQuery(query: string, ...fields: (string | number | null | undefined)[]) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalize(fields.filter((field) => field !== null && field !== undefined).join(' '))
  return words.every((word) => haystack.includes(word))
}

/** Horizontal strip that holds a search box and compact selects above a list or table. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-2 border-b border-line px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-9 text-sm text-ink placeholder:text-muted/70 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-leaf-50 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  children: ReactNode
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/25"
    >
      {children}
    </select>
  )
}

/** "12 de 40" style counter plus a reset link when any filter is active. */
export function FilterSummary({ shown, total, active, onReset }: { shown: number; total: number; active: boolean; onReset: () => void }) {
  return (
    <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
      <span className="tabular-nums">{shown}</span> de <span className="tabular-nums">{total}</span>
      {active && (
        <button type="button" onClick={onReset} className="ml-2 font-semibold text-leaf-600 hover:underline">
          Limpiar filtros
        </button>
      )}
    </p>
  )
}
