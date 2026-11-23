import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-pine-900 text-white hover:bg-pine-800 active:bg-pine-950 shadow-sm',
  secondary: 'bg-white text-pine-900 ring-1 ring-inset ring-line hover:bg-leaf-50',
  ghost: 'text-pine-900 hover:bg-leaf-50',
  danger: 'bg-danger-600 text-white hover:bg-danger-600/90',
  light: 'bg-lime-300 text-pine-950 hover:bg-lime-200',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const base =
  'inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50'

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-[var(--radius-card)] border border-line bg-white shadow-card', className)} {...rest} />
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type Tone = 'neutral' | 'green' | 'blue' | 'amber' | 'red' | 'sand'
const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  green: 'bg-leaf-100 text-pine-800',
  blue: 'bg-info-50 text-info-600',
  amber: 'bg-warn-50 text-warn-600',
  red: 'bg-danger-50 text-danger-600',
  sand: 'bg-sillar-100 text-sillar-600',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
}

export function Field({ label, hint, error, children }: FieldShellProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

const control =
  'block w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/25 disabled:bg-slate-50 disabled:text-muted'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={clsx(control, 'h-11', invalid ? 'border-danger-600' : 'border-line', className)}
          {...rest}
        />
      )}
    </Field>
  )
})

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, className, children, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={clsx(control, 'h-11', invalid ? 'border-danger-600' : 'border-line', className)}
          {...rest}
        >
          {children}
        </select>
      )}
    </Field>
  )
})

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hint, error, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          ref={ref}
          rows={3}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={clsx(control, 'py-2.5', invalid ? 'border-danger-600' : 'border-line', className)}
          {...rest}
        />
      )}
    </Field>
  )
})

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-lg bg-leaf-100/70', className)} />
}
