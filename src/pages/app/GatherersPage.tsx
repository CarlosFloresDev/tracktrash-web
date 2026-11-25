import { useMemo, useState } from 'react'
import { Check, Power, X } from 'lucide-react'
import { gathererTypes, labels, verificationStatuses, type VerificationStatus } from '@/api/enums'
import { gatherersApi } from '@/api/endpoints'
import { keys, useGathererRatings, useGatherers, useInvalidatingMutation } from '@/api/hooks'
import type { Gatherer } from '@/api/schemas'
import { useLookups } from '@/features/requests/lookups'
import { formatDateOnly, fullName } from '@/lib/format'
import { FilterBar, FilterSelect, FilterSummary, matchesQuery, SearchInput } from '@/components/ui/filters'
import { EmptyState, useToast } from '@/components/ui/feedback'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary, Rating, Table, VerificationBadge } from '@/components/ui/widgets'

export default function GatherersPage() {
  const gatherers = useGatherers()
  const ratings = useGathererRatings()
  const { userById } = useLookups({ users: true })
  const [search, setSearch] = useState('')
  const [verification, setVerification] = useState('')
  const [type, setType] = useState('')
  const toast = useToast()
  const filtered = useMemo(
    () =>
      (gatherers.data ?? []).filter((gatherer) => {
        const owner = userById.get(gatherer.userId)
        return (
          matchesQuery(search, owner ? fullName(owner) : `Usuario #${gatherer.userId}`, gatherer.verificationDocument, gatherer.description) &&
          (!verification || gatherer.verificationStatusId === verification) &&
          (!type || gatherer.gathererTypeId === type)
        )
      }),
    [gatherers.data, userById, search, verification, type],
  )
  const sorted = useMemo(
    () => filtered.toSorted((a, b) => a.verificationStatusId.localeCompare(b.verificationStatusId) || b.gathererId - a.gathererId),
    [filtered],
  )
  const paging = usePagination(sorted, `${search}|${verification}|${type}`)
  const filtersActive = Boolean(search || verification || type)
  const resetFilters = () => {
    setSearch('')
    setVerification('')
    setType('')
  }
  const mutation = useInvalidatingMutation(
    (input: { gatherer: Gatherer; verificationStatusId?: VerificationStatus; isActive?: boolean }) =>
      gatherersApi.update(input.gatherer.gathererId, {
        gathererTypeId: input.gatherer.gathererTypeId,
        description: input.gatherer.description,
        verificationDocument: input.gatherer.verificationDocument,
        verificationStatusId: input.verificationStatusId ?? input.gatherer.verificationStatusId,
        isActive: input.isActive ?? input.gatherer.isActive,
      }),
    [keys.gatherers, keys.indicators],
  )

  const act = (input: Parameters<typeof mutation.mutate>[0], message: string) =>
    mutation.mutate(input, { onSuccess: () => toast.success(message), onError: toast.error })

  return (
    <>
      <PageHeader title="Recolectores" description="Revisa documentos y decide quién puede tomar recojos." />
      <Card>
        <QueryBoundary query={gatherers}>
          {(items) => (
            <>
              <FilterBar>
                <SearchInput value={search} onChange={setSearch} label="Buscar recolectores" placeholder="Nombre, documento o descripción" />
                <FilterSelect value={verification} onChange={setVerification} label="Verificación">
                  <option value="">Todas</option>
                  {verificationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {labels.verification[status]}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect value={type} onChange={setType} label="Tipo">
                  <option value="">Todos los tipos</option>
                  {gathererTypes.map((gathererType) => (
                    <option key={gathererType} value={gathererType}>
                      {labels.gathererType[gathererType]}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSummary shown={filtered.length} total={items.length} active={filtersActive} onReset={resetFilters} />
              </FilterBar>
              {filtered.length === 0 ? (
                <EmptyState
                  title={filtersActive ? 'Ningún recolector coincide con la búsqueda' : 'Aún no hay recolectores registrados'}
                  description={filtersActive ? 'Prueba con otras palabras o limpia los filtros.' : undefined}
                  action={
                    filtersActive ? (
                      <button type="button" onClick={resetFilters} className="font-semibold text-leaf-600 hover:underline">
                        Limpiar filtros
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <Table head={['Recolector', 'Tipo', 'Documento', 'Estado', 'Calificación', 'Acciones']}>
                  {paging.pageItems.map((gatherer) => {
                      const owner = userById.get(gatherer.userId)
                      const rating = ratings.data?.find((item) => item.gathererId === gatherer.gathererId)
                      return (
                        <tr key={gatherer.gathererId} className="align-top">
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{owner ? fullName(owner) : `Usuario #${gatherer.userId}`}</p>
                            <p className="text-xs text-muted">Registrado {formatDateOnly(gatherer.createdAt.slice(0, 10))}</p>
                            {gatherer.description && <p className="mt-1 max-w-xs text-xs text-muted">{gatherer.description}</p>}
                          </td>
                          <td className="px-5 py-3.5">{labels.gathererType[gatherer.gathererTypeId]}</td>
                          <td className="px-5 py-3.5 tabular-nums">{gatherer.verificationDocument ?? '-'}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col items-start gap-1">
                              <VerificationBadge status={gatherer.verificationStatusId} />
                              {!gatherer.isActive && <Badge tone="red">Inactivo</Badge>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {rating ? (
                              <div>
                                <Rating value={rating.averageScore} size="sm" />
                                <p className="text-xs text-muted">{rating.totalGrades} calificaciones</p>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {gatherer.verificationStatusId !== 'Verified' && (
                                <Button size="sm" onClick={() => act({ gatherer, verificationStatusId: 'Verified' }, 'Recolector verificado.')}>
                                  <Check className="size-3.5" aria-hidden="true" />
                                  Verificar
                                </Button>
                              )}
                              {gatherer.verificationStatusId === 'Pending' && (
                                <Button size="sm" variant="secondary" onClick={() => act({ gatherer, verificationStatusId: 'Rejected' }, 'Recolector rechazado.')}>
                                  <X className="size-3.5" aria-hidden="true" />
                                  Rechazar
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => act({ gatherer, isActive: !gatherer.isActive }, gatherer.isActive ? 'Recolector desactivado.' : 'Recolector activado.')}>
                                <Power className="size-3.5" aria-hidden="true" />
                                {gatherer.isActive ? 'Desactivar' : 'Activar'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </Table>
              )}
              {filtered.length > 0 && <Pagination {...paging} onChange={paging.setPage} label="recolectores" />}
            </>
          )}
        </QueryBoundary>
      </Card>
    </>
  )
}
