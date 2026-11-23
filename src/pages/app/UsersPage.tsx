import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { labels, userRoles } from '@/api/enums'
import { usersApi } from '@/api/endpoints'
import { keys, useInvalidatingMutation, useUsers } from '@/api/hooks'
import type { User } from '@/api/schemas'
import { useAuth } from '@/features/auth/auth'
import { formatDateOnly, fullName } from '@/lib/format'
import { EmptyState, useToast } from '@/components/ui/feedback'
import { Badge, Button, Card, SelectField, TextField } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary, Table } from '@/components/ui/widgets'

export default function UsersPage() {
  const { user: me } = useAuth()
  const users = useUsers()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const mutation = useInvalidatingMutation(
    (input: { user: User; roleId?: User['roleId']; isActive?: boolean }) =>
      usersApi.update(input.user.userId, {
        firstName: input.user.firstName,
        lastName: input.user.lastName,
        phone: input.user.phone,
        roleId: input.roleId ?? input.user.roleId,
        locationId: input.user.locationId,
        isActive: input.isActive ?? input.user.isActive,
      }),
    [keys.users, keys.indicators],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (users.data ?? []).filter(
      (item) =>
        (!role || item.roleId === role) &&
        (!term || fullName(item).toLowerCase().includes(term) || item.email.toLowerCase().includes(term)),
    )
  }, [users.data, search, role])

  return (
    <>
      <PageHeader title="Usuarios" description="Cuentas registradas en la plataforma." />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-[2.35rem] size-4 text-muted" aria-hidden="true" />
            <TextField label="Buscar" placeholder="Nombre o correo" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" />
          </div>
          <SelectField label="Rol" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">Todos</option>
            {userRoles.map((item) => (
              <option key={item} value={item}>
                {labels.role[item]}
              </option>
            ))}
          </SelectField>
        </div>
        <QueryBoundary query={users}>
          {() =>
            filtered.length === 0 ? (
              <EmptyState title="Sin resultados" description="Prueba con otro nombre o quita el filtro de rol." />
            ) : (
              <Table head={['Usuario', 'Rol', 'Registro', 'Estado', 'Acciones']}>
                {filtered.map((item) => (
                  <tr key={item.userId}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{fullName(item)}</p>
                      <p className="text-xs text-muted">{item.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        aria-label={`Rol de ${fullName(item)}`}
                        value={item.roleId}
                        disabled={item.userId === me?.userId}
                        onChange={(event) =>
                          mutation.mutate(
                            { user: item, roleId: event.target.value as User['roleId'] },
                            { onSuccess: () => toast.success('Rol actualizado.'), onError: toast.error },
                          )
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm disabled:bg-slate-50"
                      >
                        {userRoles.map((value) => (
                          <option key={value} value={value}>
                            {labels.role[value]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatDateOnly(item.createdAt.slice(0, 10))}</td>
                    <td className="px-5 py-3.5">{item.isActive ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</td>
                    <td className="px-5 py-3.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={item.userId === me?.userId}
                        onClick={() =>
                          mutation.mutate(
                            { user: item, isActive: !item.isActive },
                            { onSuccess: () => toast.success(item.isActive ? 'Usuario desactivado.' : 'Usuario activado.'), onError: toast.error },
                          )
                        }
                      >
                        {item.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )
          }
        </QueryBoundary>
      </Card>
    </>
  )
}
