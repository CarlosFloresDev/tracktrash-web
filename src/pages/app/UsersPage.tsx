import { useMemo, useState } from 'react'
import { labels, userRoles } from '@/api/enums'
import { usersApi } from '@/api/endpoints'
import { keys, useInvalidatingMutation, useUsers } from '@/api/hooks'
import type { User } from '@/api/schemas'
import { useAuth } from '@/features/auth/auth'
import { formatDateOnly, fullName } from '@/lib/format'
import { FilterBar, FilterSelect, FilterSummary, matchesQuery, SearchInput } from '@/components/ui/filters'
import { EmptyState, useToast } from '@/components/ui/feedback'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary, Table } from '@/components/ui/widgets'

export default function UsersPage() {
  const { user: me } = useAuth()
  const users = useUsers()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

  const resetFilters = () => {
    setSearch('')
    setRole('')
    setStatus('')
  }

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

  const filtered = useMemo(
    () =>
      (users.data ?? []).filter(
        (item) =>
          matchesQuery(search, fullName(item), item.email, item.phone) &&
          (!role || item.roleId === role) &&
          (!status || (status === 'active' ? item.isActive : !item.isActive)),
      ),
    [users.data, search, role, status],
  )
  const filtersActive = Boolean(search || role || status)

  return (
    <>
      <PageHeader title="Usuarios" description="Cuentas registradas en la plataforma." />
      <Card>
        <QueryBoundary query={users}>
          {(items) => (
            <>
              <FilterBar>
                <SearchInput value={search} onChange={setSearch} label="Buscar usuarios" placeholder="Nombre, correo o teléfono" />
                <FilterSelect value={role} onChange={setRole} label="Rol">
                  <option value="">Todos los roles</option>
                  {userRoles.map((item) => (
                    <option key={item} value={item}>
                      {labels.role[item]}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect value={status} onChange={setStatus} label="Estado">
                  <option value="">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </FilterSelect>
                <FilterSummary shown={filtered.length} total={items.length} active={filtersActive} onReset={resetFilters} />
              </FilterBar>
              {filtered.length === 0 ? (
                <EmptyState
                  title={filtersActive ? 'Ningún usuario coincide con la búsqueda' : 'Sin resultados'}
                  description={filtersActive ? 'Prueba con otras palabras o limpia los filtros.' : 'Prueba con otro nombre o quita los filtros.'}
                  action={
                    filtersActive ? (
                      <button type="button" onClick={resetFilters} className="font-semibold text-leaf-600 hover:underline">
                        Limpiar filtros
                      </button>
                    ) : undefined
                  }
                />
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
              )}
            </>
          )}
        </QueryBoundary>
      </Card>
    </>
  )
}
