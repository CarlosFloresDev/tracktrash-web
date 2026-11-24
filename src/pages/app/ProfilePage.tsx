import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { labels } from '@/api/enums'
import { gatherersApi, usersApi } from '@/api/endpoints'
import { useResidueTypes } from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { fullName } from '@/lib/format'
import { errorMessage, useToast } from '@/components/ui/feedback'
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
  const { user, gatherer, organization, setUser, signOut } = useAuth()
  const residueTypes = useResidueTypes(Boolean(gatherer))
  const toast = useToast()
  const [passwordError, setPasswordError] = useState<string | null>(null)
  // Only the user's edits live in state; until then the selection mirrors the saved profile.
  const [editedResidueIds, setEditedResidueIds] = useState<number[] | null>(null)
  const supportedResidueIds =
    editedResidueIds ?? gatherer?.supportedResidueTypes?.map((item) => item.residueTypeId) ?? []
  const [savingResidues, setSavingResidues] = useState(false)

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
                setUser(await usersApi.me())
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
                <form
                  className="mt-5 space-y-3 border-t border-line pt-4"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    setSavingResidues(true)
                    try {
                      await gatherersApi.setMyResidueTypes(supportedResidueIds)
                      toast.success('Materiales aceptados actualizados.')
                    } catch (error) {
                      toast.error(error)
                    } finally {
                      setSavingResidues(false)
                    }
                  }}
                >
                  <div>
                    <h3 className="text-sm font-semibold">Materiales que aceptas</h3>
                    <p className="text-sm text-muted">Solo verás solicitudes cuyos materiales coincidan con tu selección.</p>
                  </div>
                  {residueTypes.data?.filter((item) => item.isActive && item.isRecyclable).map((item) => (
                    <label key={item.residueTypeId} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-leaf-600"
                        checked={supportedResidueIds.includes(item.residueTypeId)}
                        onChange={(event) => setEditedResidueIds(event.target.checked
                          ? [...supportedResidueIds, item.residueTypeId]
                          : supportedResidueIds.filter((id) => id !== item.residueTypeId))}
                      />
                      {item.name}
                    </label>
                  ))}
                  {supportedResidueIds.length === 0 && <p role="alert" className="text-sm text-danger-600">Selecciona al menos un material.</p>}
                  <Button type="submit" loading={savingResidues} disabled={supportedResidueIds.length === 0}>
                    Guardar materiales
                  </Button>
                </form>
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
                  signOut()
                  toast.success('Contraseña actualizada.')
                } catch (error) {
                  setPasswordError(errorMessage(error))
                }
              })}
            >

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
