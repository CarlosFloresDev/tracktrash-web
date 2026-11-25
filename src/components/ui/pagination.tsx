import { useState, type MouseEvent } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZE = 10

/**
 * Splits a list into pages. `resetKey` should change whenever filters or search change, so the user
 * goes back to page 1 instead of landing on an empty page.
 */
export function usePagination<T>(items: readonly T[], resetKey: unknown, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [lastKey, setLastKey] = useState(resetKey)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  let current = page
  if (!Object.is(lastKey, resetKey)) {
    setLastKey(resetKey)
    setPage(1)
    current = 1
  }
  current = Math.min(current, pageCount)

  return {
    page: current,
    pageCount,
    setPage,
    pageItems: items.slice((current - 1) * pageSize, current * pageSize),
    from: items.length === 0 ? 0 : (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, items.length),
    total: items.length,
  }
}

/** Page numbers to show: always first and last, the current one and its neighbours, with gaps. */
function pageList(page: number, count: number): (number | 'gap')[] {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count))
  const sorted = [...pages].toSorted((a, b) => a - b)
  const out: (number | 'gap')[] = []
  for (const [i, p] of sorted.entries()) {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap')
    out.push(p)
  }
  return out
}

export function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  onChange,
  label = 'resultados',
}: {
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  onChange: (page: number) => void
  label?: string
}) {
  if (total === 0) return null
  const go = (next: number, event: MouseEvent<HTMLButtonElement>) => {
    onChange(next)
    // Bring the top of the list back into view when the user paged from further down.
    const list = event.currentTarget.closest('nav')?.parentElement
    requestAnimationFrame(() => {
      if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start' })
    })
  }

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row"
    >
      <p className="text-sm text-muted">
        <span className="font-medium tabular-nums text-ink">
          {from}–{to}
        </span>{' '}
        de <span className="tabular-nums">{total}</span> {label}
      </p>
      {pageCount > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              onClick={(event) => go(page - 1, event)}
              disabled={page === 1}
              aria-label="Página anterior"
              className="grid size-9 place-items-center rounded-full text-pine-900 transition-colors hover:bg-leaf-50 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
          </li>
          {pageList(page, pageCount).map((item, index) =>
            item === 'gap' ? (
              <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={(event) => go(item, event)}
                  aria-current={item === page ? 'page' : undefined}
                  aria-label={`Página ${item}`}
                  className={clsx(
                    'grid size-9 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                    item === page ? 'bg-pine-900 text-white' : 'text-pine-900 hover:bg-leaf-50',
                  )}
                >
                  {item}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              onClick={(event) => go(page + 1, event)}
              disabled={page === pageCount}
              aria-label="Página siguiente"
              className="grid size-9 place-items-center rounded-full text-pine-900 transition-colors hover:bg-leaf-50 disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  )
}
