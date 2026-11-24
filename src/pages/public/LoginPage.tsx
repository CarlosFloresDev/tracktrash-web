import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/features/auth/auth'
import { LogoMark } from '@/components/brand/Logo'
import { Button, Card, TextField } from '@/components/ui/primitives'
import { errorMessage, Notice } from '@/components/ui/feedback'

const schema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo').email('El correo no es válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
type FormValues = z.infer<typeof schema>

export function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden lg:block">
        <img src="/mascot.webp" alt="" width="900" height="900" className="mx-auto w-full max-w-md" />
        <p className="mx-auto mt-2 max-w-sm text-center text-muted">
          Cada kilo cuenta. Coordina tus recojos y mide lo que recuperamos juntos.
        </p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <LogoMark className="size-12" />
        <h1 className="mt-5 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
        <Card className="mt-6 p-6">{children}</Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/app" replace />
  const registered = (location.state as { registered?: boolean } | null)?.registered

  return (
    <AuthFrame title="Ingresa a tu cuenta" subtitle="Sigue tus recojos y registra lo recuperado.">
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setError(null)
          try {
            await signIn(values.email, values.password)
            navigate('/app', { replace: true })
          } catch (cause) {
            setError(errorMessage(cause))
          }
        })}
      >
        {registered && <Notice tone="success">Tu cuenta fue creada. Ya puedes ingresar.</Notice>}

        <TextField label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Ingresar
        </Button>
        <p className="text-center text-sm text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-leaf-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}
