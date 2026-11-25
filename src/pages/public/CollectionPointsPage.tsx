import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Clock, MapPin, Phone, User } from 'lucide-react'
import { useCollectionPoints, useLocations } from '@/api/hooks'
import { PointsMap, type MapPoint } from '@/components/map/PointsMap'
import { FilterBar, FilterSelect, FilterSummary, matchesQuery, SearchInput } from '@/components/ui/filters'
import { EmptyState } from '@/components/ui/feedback'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { QueryBoundary } from '@/components/ui/widgets'
import { Card } from '@/components/ui/primitives'

export default function CollectionPointsPage() {
  const points = useCollectionPoints()
  const locations = useLocations()
  const [selected, setSelected] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')

  const locationById = useMemo(() => new Map(locations.data?.map((location) => [location.locationId, location])), [locations.data])
  const active = useMemo(() => points.data?.filter((point) => point.isActive) ?? [], [points.data])
  const districts = useMemo(
    () => [...new Set(active.map((point) => locationById.get(point.locationId)?.district).filter(Boolean))].toSorted() as string[],
    [active, locationById],
  )
  const filtered = useMemo(
    () =>
      active.filter((point) => {
        const location = locationById.get(point.locationId)
        return (
          matchesQuery(search, point.name, location?.address, location?.district, point.description, point.openingHours) &&
          (!district || location?.district === district)
        )
      }),
    [active, locationById, search, district],
  )
  const filtersActive = Boolean(search || district)
  const paging = usePagination(filtered, `${search}|${district}`)
  const resetFilters = () => {
    setSearch('')
    setDistrict('')
  }

  const mapPoints = useMemo<MapPoint[]>(
    () =>
      filtered.flatMap((point) => {
        const location = locationById.get(point.locationId)
        if (!location || location.latitude === null || location.longitude === null) return []
        return [{ id: point.collectionPointId, name: point.name, latitude: location.latitude, longitude: location.longitude, subtitle: location.address }]
      }),
    [filtered, locationById],
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Puntos de acopio</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Lugares donde puedes entregar tus materiales directamente. Consulta horarios y contacto antes de ir.
      </p>

      <QueryBoundary query={points} rows={3}>
        {() =>
          active.length === 0 ? (
            <Card className="mt-8">
              <EmptyState title="Aún no hay puntos de acopio activos" description="Cuando el equipo registre puntos, aparecerán aquí." />
            </Card>
          ) : (
            <div className="mt-8">
              <Card>
                <FilterBar>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    label="Buscar puntos de acopio"
                    placeholder="Nombre, dirección, distrito, descripción u horario"
                  />
                  <FilterSelect value={district} onChange={setDistrict} label="Distrito">
                    <option value="">Todos los distritos</option>
                    {districts.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </FilterSelect>
                  <FilterSummary shown={filtered.length} total={active.length} active={filtersActive} onReset={resetFilters} />
                </FilterBar>
              </Card>
              {filtered.length === 0 ? (
                <Card className="mt-6">
                  <EmptyState
                    title="Ningún punto de acopio coincide con la búsqueda"
                    description="Prueba con otras palabras o limpia los filtros."
                    action={
                      <button type="button" onClick={resetFilters} className="font-semibold text-leaf-600 hover:underline">
                        Limpiar filtros
                      </button>
                    }
                  />
                </Card>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  <div className="order-2 lg:order-1">
                    <ul className="space-y-3 lg:max-h-[34rem] lg:overflow-y-auto lg:pr-1">
                      {paging.pageItems.map((point) => {
                        const location = locationById.get(point.locationId)
                        const isSelected = selected === point.collectionPointId
                        return (
                          <li key={point.collectionPointId}>
                            <button
                              type="button"
                              onClick={() => setSelected(point.collectionPointId)}
                              aria-pressed={isSelected}
                              className={clsx(
                                'w-full rounded-2xl border bg-white p-4 text-left shadow-card transition-colors',
                                isSelected ? 'border-leaf-600 ring-2 ring-leaf-600/20' : 'border-line hover:border-leaf-400',
                              )}
                            >
                              <h2 className="font-display text-lg font-semibold">{point.name}</h2>
                              {point.description && <p className="mt-1 text-sm text-muted">{point.description}</p>}
                              <ul className="mt-3 space-y-1.5 text-sm text-ink">
                                {location && (
                                  <li className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                                    {location.address}, {location.district}
                                  </li>
                                )}
                                {point.openingHours && (
                                  <li className="flex items-start gap-2">
                                    <Clock className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                                    {point.openingHours}
                                  </li>
                                )}
                                {point.phone && (
                                  <li className="flex items-start gap-2">
                                    <Phone className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                                    {point.phone}
                                  </li>
                                )}
                                {point.managerName && (
                                  <li className="flex items-start gap-2">
                                    <User className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                                    Encargado: {point.managerName}
                                  </li>
                                )}
                              </ul>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <Pagination {...paging} onChange={paging.setPage} label="puntos" />
                  </div>
                  <div className="order-1 overflow-hidden rounded-2xl border border-line shadow-card lg:sticky lg:top-24 lg:order-2 lg:h-[34rem]">
                    <PointsMap points={mapPoints} selectedId={selected} onSelect={setSelected} className="h-80 w-full lg:h-full" />
                  </div>
                </div>
              )}
            </div>
          )
        }
      </QueryBoundary>
    </div>
  )
}
