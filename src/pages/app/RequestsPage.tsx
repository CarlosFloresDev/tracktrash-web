import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { labels, requestStatuses, type RequestStatus } from '@/api/enums'
import { useVisibleRequestDetails, useAllRequests, useUserRequests } from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { useLookups } from '@/features/requests/lookups'
import { fullName } from '@/lib/format'
import { FilterBar, FilterSelect, FilterSummary, matchesQuery, SearchInput } from '@/components/ui/filters'
import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { EmptyState } from '@/components/ui/feedback'
import { ButtonLink, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

type Filter = 'all' | RequestStatus
type Sort = 'recent' | 'upcoming' | 'oldest'

export default function RequestsPage() {
  const { user } = useAuth()
  const isAdmin = user?.roleId === 'Admin'
  const mine = useUserRequests(isAdmin ? undefined : user?.userId)
  const all = useAllRequests(isAdmin)
  const query = isAdmin ? all : mine
  const details = useVisibleRequestDetails((query.data ?? []).map((item) => item.collectRequestId))
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [material, setMaterial] = useState('')
  const [district, setDistrict] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const grouped = useMemo(() => groupDetails(details.data.flatMap((item) => item.details)), [details.data])
  const { locationById, residueById, userById } = useLookups({ users: isAdmin })
  const resetFilters = () => {
    setSearch('')
    setMaterial('')
    setDistrict('')
    setSort('recent')
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Solicitudes' : 'Mis solicitudes'}
        description={isAdmin ? 'Todas las solicitudes de recojo de la plataforma.' : 'Sigue el estado de cada recojo que pediste.'}
        actions={
          !isAdmin && (
            <ButtonLink to="/app/solicitudes/nueva">
              <Plus className="size-4" aria-hidden="true" />
              Nueva solicitud
            </ButtonLink>
          )
        }
      />
      <Card>
        <QueryBoundary query={query}>
          {(requests) => {
            const counts = new Map<Filter, number>([['all', requests.length]])
            for (const status of requestStatuses) counts.set(status, requests.filter((item) => item.statusId === status).length)
            const materialIds = new Set(
              requests.flatMap((item) => (grouped.get(item.collectRequestId) ?? []).map((detail) => detail.residueTypeId)),
            )
            const districts = [
              ...new Set(requests.map((item) => locationById.get(item.locationId)?.district).filter(Boolean)),
            ].toSorted() as string[]
            const filtersActive = Boolean(search || material || district || sort !== 'recent')
            const when = (item: (typeof requests)[number]) => `${item.scheduledDate}T${item.scheduledTime}`
            const visible = requests
              .filter((item) => filter === 'all' || item.statusId === filter)
              .filter((item) => {
                const location = locationById.get(item.locationId)
                const owner = isAdmin ? userById.get(item.userId) : undefined
                const itemDetails = grouped.get(item.collectRequestId) ?? []
                return (
                  matchesQuery(
                    search,
                    `#${item.collectRequestId}`,
                    location?.address,
                    location?.district,
                    owner && fullName(owner),
                    item.observations,
                    ...itemDetails.map((detail) => residueById.get(detail.residueTypeId)?.name),
                  ) &&
                  (!material || itemDetails.some((detail) => String(detail.residueTypeId) === material)) &&
                  (!district || location?.district === district)
                )
              })
              .toSorted((a, b) =>
                sort === 'upcoming'
                  ? when(a).localeCompare(when(b))
                  : sort === 'oldest'
                    ? a.collectRequestId - b.collectRequestId
                    : b.collectRequestId - a.collectRequestId,
              )
            return (
              <>
                <div role="tablist" aria-label="Filtrar por estado" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
                  {(['all', ...requestStatuses] as Filter[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={filter === option}
                      onClick={() => setFilter(option)}
                      className={clsx(
                        'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                        filter === option ? 'bg-pine-900 text-white' : 'text-muted hover:bg-leaf-50',
                      )}
                    >
                      {option === 'all' ? 'Todas' : labels.status[option]}
                      <span className="ml-1.5 tabular-nums opacity-70">{counts.get(option)}</span>
                    </button>
                  ))}
                </div>
                <FilterBar>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    label="Buscar solicitudes"
                    placeholder={isAdmin ? 'N°, dirección, distrito, solicitante o material' : 'N°, dirección, distrito o material'}
                  />
                  <FilterSelect value={material} onChange={setMaterial} label="Filtrar por material">
                    <option value="">Todos los materiales</option>
                    {[...materialIds]
                      .map((id) => residueById.get(id))
                      .filter((item) => item !== undefined)
                      .toSorted((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <option key={item.residueTypeId} value={item.residueTypeId}>
                          {item.name}
                        </option>
                      ))}
                  </FilterSelect>
                  <FilterSelect value={district} onChange={setDistrict} label="Filtrar por distrito">
                    <option value="">Todos los distritos</option>
                    {districts.map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </FilterSelect>
                  <FilterSelect value={sort} onChange={(value) => setSort(value as Sort)} label="Ordenar">
                    <option value="recent">Más recientes</option>
                    <option value="upcoming">Próximas por fecha</option>
                    <option value="oldest">Más antiguas</option>
                  </FilterSelect>
                  <FilterSummary shown={visible.length} total={requests.length} active={filtersActive} onReset={resetFilters} />
                </FilterBar>
                {visible.length === 0 ? (
                  <EmptyState
                    icon={<EmptyBoxIllustration className="w-24" />}
                    title={
                      filtersActive
                        ? 'Ninguna solicitud coincide con la búsqueda'
                        : filter === 'all'
                          ? 'Aún no hay solicitudes'
                          : 'No hay solicitudes en este estado'
                    }
                    description={
                      filtersActive
                        ? 'Prueba con otras palabras o limpia los filtros.'
                        : !isAdmin && filter === 'all'
                          ? 'Pide tu primer recojo en menos de dos minutos.'
                          : undefined
                    }
                    action={
                      filtersActive ? (
                        <button type="button" onClick={resetFilters} className="font-semibold text-leaf-600 hover:underline">
                          Limpiar filtros
                        </button>
                      ) : !isAdmin && filter === 'all' ? (
                        <ButtonLink to="/app/solicitudes/nueva">Crear solicitud</ButtonLink>
                      ) : undefined
                    }
                  />
                ) : (
                  <RequestList requests={visible} detailsByRequest={grouped} showOwner={isAdmin} />
                )}
              </>
            )
          }}
        </QueryBoundary>
      </Card>
    </>
  )
}
