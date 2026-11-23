import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import { Building2, Home, Truck, type LucideIcon } from 'lucide-react'
import { gathererTypes, labels, organizationTypes, type UserRole } from '@/api/enums'
import { gatherersApi, locationsApi, organizationsApi, usersApi } from '@/api/endpoints'
import { useAuth } from '@/features/auth/auth'
import { Button, SelectField, TextAreaField, TextField } from '@/components/ui/primitives'
import { errorMessage } from '@/components/ui/feedback'
import { AuthFrame } from './LoginPage'

const roleOptions: { role: Extract<UserRole, 'Generator' | 'Organization' | 'Gatherer'>; label: string; hint: string; icon: LucideIcon }[] = [
  { role: 'Generator', label: 'Hogar', hint: 'Pido recojos', icon: Home },
  { role: 'Organization', label: 'Organización', hint: 'Colegio o negocio', icon: Building2 },
  { role: 'Gatherer', label: 'Recolector', hint: 'Recojo y recupero', icon: Truck },
]

const schema = z
  .object({
    role: z.enum(['Generator', 'Organization', 'Gatherer']),
    firstName: z.string().trim().min(1, 'Ingresa tu nombre').max(100),
    lastName: z.string().trim().min(1, 'Ingresa tus apellidos').max(100),
    email: z.string().min(1, 'Ingresa tu correo').email('El correo no es válido').max(150),
    phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
    password: z.string().min(8, 'Usa al menos 8 caracteres').max(100),
    district: z.string().trim().min(1, 'Indica tu distrito'),
    address: z.string().trim().min(1, 'Indica tu dirección').max(250),
    businessName: z.string().trim().max(180).optional(),
    taxId: z.string().trim().regex(/^(\d{11})?$/, 'El RUC tiene 11 dígitos').optional(),
    organizationType: z.enum(organizationTypes).optional(),
    gathererType: z.enum(gathererTypes).optional(),
    description: z.string().max(500).optional(),
    verificationDocument: z.string().trim().max(50).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'Organization' && !values.businessName) {
      ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Ingresa la razón social' })
    }
  })
type FormValues = z.infer<typeof schema>

const districts = [
  'Arequipa', 'Cayma', 'Cerro Colorado', 'Yanahuara', 'Sachaca', 'Socabaya', 'Paucarpata', 'Miraflores',
  'José Luis Bustamante y Rivero', 'Characato', 'Mariano Melgar', 'Alto Selva Alegre', 'Hunter', 'Tiabaya',
]

export function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Generator', district: 'Arequipa', organizationType: 'Other', gathererType: 'Independent' },
  })
  const role = useWatch({ control, name: 'role' })

  if (user) return <Navigate to="/app" replace />

  async function onSubmit(values: FormValues) {
    setError(null)
    try {
      const locationId = await locationsApi.create({
        address: values.address,
        district: values.district,
        province: 'Arequipa',
        department: 'Arequipa',
      })
      const userId = await usersApi.create({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email.trim().toLowerCase(),
        phone: values.phone || null,
        password: values.password,
        roleId: values.role,
        locationId,
      })
      if (values.role === 'Organization') {
        await organizationsApi.create({
          userId,
          businessName: values.businessName!,
          taxId: values.taxId || null,
          organizationTypeId: values.organizationType ?? 'Other',
          locationId,
          subscriptionPlanId: 'Basic',
        })
      }
      if (values.role === 'Gatherer') {
        await gatherersApi.create({
          userId,
          gathererTypeId: values.gathererType ?? 'Independent',
          description: values.description || null,
          verificationDocument: values.verificationDocument || null,
        })
      }
      navigate('/ingresar', { replace: true, state: { registered: true } })
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <AuthFrame title="Crea tu cuenta" subtitle="Elige cómo vas a usar TrackTrash. Podrás cambiarlo con el equipo después.">
      <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Soy</legend>
          <div className="grid grid-cols-3 gap-2">
            {roleOptions.map(({ role: value, label, hint, icon: Icon }) => (
              <label
                key={value}
                className={clsx(
                  'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-leaf-600',
                  role === value ? 'border-leaf-600 bg-leaf-50' : 'border-line hover:bg-leaf-50/60',
                )}
              >
                <input type="radio" value={value} className="sr-only" {...register('role')} />
                <Icon className={clsx('size-5', role === value ? 'text-leaf-600' : 'text-muted')} aria-hidden="true" />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nombres" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} />
          <TextField label="Apellidos" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <TextField label="Correo" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Teléfono (opcional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            hint="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Distrito" error={errors.district?.message} {...register('district')}>
            {districts.map((district) => (
              <option key={district}>{district}</option>
            ))}
          </SelectField>
          <TextField label="Dirección" autoComplete="street-address" error={errors.address?.message} {...register('address')} />
        </div>

        {role === 'Organization' && (
          <div className="space-y-4 rounded-xl bg-leaf-50 p-4">
            <TextField label="Razón social" error={errors.businessName?.message} {...register('businessName')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="RUC (opcional)" inputMode="numeric" maxLength={11} error={errors.taxId?.message} {...register('taxId')} />
              <SelectField label="Tipo de organización" {...register('organizationType')}>
                {organizationTypes.map((type) => (
                  <option key={type} value={type}>
                    {labels.organizationType[type]}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        )}

        {role === 'Gatherer' && (
          <div className="space-y-4 rounded-xl bg-leaf-50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Tipo de recolector" {...register('gathererType')}>
                {gathererTypes.map((type) => (
                  <option key={type} value={type}>
                    {labels.gathererType[type]}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Documento de verificación"
                hint="DNI o RUC. El equipo lo revisará."
                error={errors.verificationDocument?.message}
                {...register('verificationDocument')}
              />
            </div>
            <TextAreaField label="Cuéntanos qué recoges y dónde" error={errors.description?.message} {...register('description')} />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/ingresar" className="font-semibold text-leaf-600 hover:underline">
            Ingresa
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}
