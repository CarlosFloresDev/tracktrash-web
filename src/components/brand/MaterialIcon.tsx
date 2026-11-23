import type { ReactNode } from 'react'
import clsx from 'clsx'

export type MaterialKind = 'paper' | 'plastic' | 'glass' | 'metal' | 'carton' | 'oil' | 'organic' | 'other'

/** Maps catalog names (as seeded by the backend team) to an icon family. Falls back to a generic bin. */
export function materialKind(name: string): MaterialKind {
  const value = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
  if (/tetra|carton de|envase/.test(value)) return 'carton'
  if (/papel|carton/.test(value)) return 'paper'
  if (/plastic|pet|botella/.test(value)) return 'plastic'
  if (/vidrio|glass/.test(value)) return 'glass'
  if (/metal|lata|aluminio/.test(value)) return 'metal'
  if (/aceite/.test(value)) return 'oil'
  if (/organ|compost/.test(value)) return 'organic'
  return 'other'
}

const palette: Record<MaterialKind, { bg: string; fg: string }> = {
  paper: { bg: 'bg-sillar-100', fg: 'text-sillar-600' },
  plastic: { bg: 'bg-info-50', fg: 'text-info-600' },
  glass: { bg: 'bg-leaf-50', fg: 'text-leaf-600' },
  metal: { bg: 'bg-slate-100', fg: 'text-slate-600' },
  carton: { bg: 'bg-warn-50', fg: 'text-warn-600' },
  oil: { bg: 'bg-warn-50', fg: 'text-warn-600' },
  organic: { bg: 'bg-lime-200/60', fg: 'text-pine-700' },
  other: { bg: 'bg-leaf-50', fg: 'text-leaf-600' },
}

const glyphs: Record<MaterialKind, ReactNode> = {
  paper: (
    <>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4" />
      <path d="M10 12h6M10 16h6" />
    </>
  ),
  plastic: (
    <>
      <path d="M10 3h4v3l1.5 2.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V8.5L10 6z" />
      <path d="M8.5 12h7M8.5 16h7" />
    </>
  ),
  glass: (
    <>
      <path d="M9 3h6v4c0 1 2 2 2 4v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8c0-2 2-3 2-4z" />
      <path d="M7.5 13h9" />
    </>
  ),
  metal: (
    <>
      <path d="M8 5h8l1 2v12l-1 2H8l-1-2V7z" />
      <path d="M7 7h10M7 19h10M10 10v5" />
    </>
  ),
  carton: (
    <>
      <path d="M7 8l5-4 5 4v12H7z" />
      <path d="M7 8h10M12 4v4M10 13h4" />
    </>
  ),
  oil: (
    <>
      <path d="M12 3c3.5 4.2 6 7 6 10.2A6 6 0 0 1 12 19a6 6 0 0 1-6-5.8C6 10 8.5 7.2 12 3z" />
      <path d="M9.5 14.200a2.6 2.6 0 0 0 2 2" />
    </>
  ),
  organic: (
    <>
      <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z" />
      <path d="M5 19c3-4 6-7 10-9" />
    </>
  ),
  other: (
    <>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
}

interface MaterialIconProps {
  kind: MaterialKind
  className?: string
  /** Renders just the glyph, without the tinted tile behind it. */
  bare?: boolean
}

export function MaterialIcon({ kind, className, bare = false }: MaterialIconProps) {
  const { bg, fg } = palette[kind]
  const svg = (
    <svg
      viewBox="0 0 24 24"
      className={clsx('size-6', fg, bare && className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyphs[kind]}
    </svg>
  )
  if (bare) return svg
  return <span className={clsx('inline-grid size-11 shrink-0 place-items-center rounded-xl', bg, className)}>{svg}</span>
}
