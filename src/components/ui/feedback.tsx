import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, Inbox, X } from 'lucide-react'
import { ApiError } from '@/lib/http'
import { Button, Skeleton } from './primitives'

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Algo salio mal. Intenta de nuevo.'
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-leaf-50 text-leaf-600">
        {icon ?? <Inbox className="size-8" aria-hidden="true" />}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-danger-50 text-danger-600">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">No pudimos cargar esta informacion</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warn' | 'success'
  title?: string
  children: ReactNode
}) {
  const styles = {
    info: 'border-info-600/25 bg-info-50 text-info-600',
    warn: 'border-warn-600/25 bg-warn-50 text-warn-600',
    success: 'border-leaf-600/25 bg-leaf-50 text-pine-800',
  }[tone]
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', styles)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? 'mt-0.5' : undefined}>{children}</div>
    </div>
  )
}

interface ToastItem {
  id: number
  tone: 'success' | 'error'
  message: string
}

const ToastContext = createContext<((tone: ToastItem['tone'], message: string) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const push = useCallback((tone: ToastItem['tone'], message: string) => {
    const id = ++counter.current
    setItems((current) => [...current, { id, tone, message }])
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 5000)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl bg-pine-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            {item.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime-300" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn-50" aria-hidden="true" />
            )}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast must be used inside ToastProvider')
  return useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (error: unknown) => push('error', errorMessage(error)),
    }),
    [push],
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-pine-950/50"
    >
      {open && (
        <div>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-leaf-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
