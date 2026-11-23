import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { labels } from '@/api/enums'
import { usersApi } from '@/api/endpoints'
import { useAuth } from '@/features/auth/auth'
import { authGateway } from '@/features/auth/gateway'
import { fullName } from '@/lib/format'
import { errorMessage, Notice, useToast } from '@/components/ui/feedback'
import { Badge, Button, Card, CardHeader, TextField } from '@/components/ui/primitives'
import { DefinitionList, PageHeader, VerificationBadge } from '@/components/ui/widgets'

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa tu nombre').max(100),
  lastName: z.string().trim().min(1, 'Ingresa tus apellidos').max(100),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'Usa al menos 8 caracteres').max(100),
    confirm: z.string(),
  })
  .refine((values) => values.newPassword === values.confirm, { path: ['confirm'], message: 'Las contraseñas no coinciden' })
type PasswordValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, gatherer, organization, setUser } = useAuth()
  const toast = useToast()
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: user ? { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' } : undefined,
  })
  const password = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  if (!user) return null

  return (
    <>
      <PageHeader title="Mi perfil" description={`${fullName(user)} · ${labels.role[user.roleId]}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Datos personales" />
          <form
            noValidate
            className="space-y-4 p-5"
            onSubmit={profile.handleSubmit(async (values) => {
              try {
                await usersApi.update(user.userId, {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  phone: values.phone || null,
                  roleId: user.roleId,
                  locationId: user.locationId,
                  isActive: user.isActive,
                })
                setUser(await usersApi.byId(user.userId))
                toast.success('Perfil actualizado.')
              } catch (error) {
                toast.error(error)
              }
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nombres" error={profile.formState.errors.firstName?.message} {...profile.register('firstName')} />
              <TextField label="Apellidos" error={profile.formState.errors.lastName?.message} {...profile.register('lastName')} />
            </div>
            <TextField label="Correo" value={user.email} disabled readOnly hint="El correo identifica tu cuenta y no se puede cambiar aquí." />
            <TextField label="Teléfono" type="tel" error={profile.formState.errors.phone?.message} {...profile.register('phone')} />
            <Button type="submit" loading={profile.formState.isSubmitting}>
              Guardar cambios
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          {organization && (
            <Card>
              <CardHeader title="Organización" />
              <div className="p-5">
                <DefinitionList
                  items={[
                    { label: 'Razón social', value: organization.businessName },
                    { label: 'RUC', value: organization.taxId ?? '-' },
                    { label: 'Tipo', value: labels.organizationType[organization.organizationTypeId] },
                    { label: 'Plan', value: <Badge tone="green">{labels.plan[organization.subscriptionPlanId]}</Badge> },
                  ]}
                />
              </div>
            </Card>
          )}
          {gatherer && (
            <Card>
              <CardHeader title="Recolector" />
              <div className="p-5">
                <DefinitionList
                  items={[
                    { label: 'Tipo', value: labels.gathererType[gatherer.gathererTypeId] },
                    { label: 'Verificación', value: <VerificationBadge status={gatherer.verificationStatusId} /> },
                    { label: 'Documento', value: gatherer.verificationDocument ?? '-' },
                    { label: 'Descripción', value: gatherer.description ?? '-' },
                  ]}
                />
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Contraseña" />
            <form
              noValidate
              className="space-y-4 p-5"
              onSubmit={password.handleSubmit(async (values) => {
                setPasswordError(null)
                try {
                  await usersApi.changePassword(user.userId, { currentPassword: values.currentPassword, newPassword: values.newPassword })
                  password.reset()
                  toast.success('Contraseña actualizada.')
                } catch (error) {
                  setPasswordError(errorMessage(error))
                }
              })}
            >
              {!authGateway.verifiesPassword && (
                <Notice tone="warn">La contraseña se guarda correctamente, pero el servidor aún no la exige para ingresar.</Notice>
              )}
              <TextField label="Contraseña actual" type="password" autoComplete="current-password" error={password.formState.errors.currentPassword?.message} {...password.register('currentPassword')} />
              <TextField label="Nueva contraseña" type="password" autoComplete="new-password" error={password.formState.errors.newPassword?.message} {...password.register('newPassword')} />
              <TextField label="Repite la nueva contraseña" type="password" autoComplete="new-password" error={password.formState.errors.confirm?.message} {...password.register('confirm')} />
              {passwordError && <p role="alert" className="text-sm text-danger-600">{passwordError}</p>}
              <Button type="submit" variant="secondary" loading={password.formState.isSubmitting}>
                Cambiar contraseña
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
