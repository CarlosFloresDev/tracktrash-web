import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Building2, CheckCircle2, ClipboardList, PackageSearch, Plus, Scale, ShieldCheck, Star, Truck, Users } from 'lucide-react'
import { labels, requestStatuses } from '@/api/enums'
import {
  useOwnGathererGrades,
  useVisibleMaterials,
  useVisibleRequestDetails,
  useAllRequestDetails,
  useAllRequests,
  useGathererRatings,
  useGathererServices,
  useGeneralIndicators,
  usePendingRequests,
  useResiduesByType,
  useUserRequests,
} from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { formatKg, formatNumber, fullName } from '@/lib/format'
import { ButtonLink, Card, CardHeader } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader, QueryBoundary, Rating, StatCard } from '@/components/ui/widgets'

const statusColors = { Pending: '#d9a520', Assigned: '#1d6fa5', InProgress: '#a8793a', Completed: '#217a51', Cancelled: '#c2410c' }

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.roleId === 'Admin') return <AdminDashboard />
  if (user.roleId === 'Gatherer') return <GathererDashboard />
  return <ResidentDashboard />
}

function AdminDashboard() {
  const general = useGeneralIndicators()
  const residues = useResiduesByType()
  const ratings = useGathererRatings()
  const requests = useAllRequests()
  const details = useAllRequestDetails()
  const grouped = useMemo(() => groupDetails(details.data), [details.data])

  const byStatus = useMemo(
    () =>
      requestStatuses.map((status) => ({
        status,
        name: labels.status[status],
        value: requests.data?.filter((item) => item.statusId === status).length ?? 0,
      })),
    [requests.data],
  )

  return (
    <>
      <PageHeader title="Indicadores" description="Estado general de la operación en Arequipa." />
      <QueryBoundary query={general} rows={2}>
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Kilos recuperados" value={formatKg(data.recoveredKilograms)} icon={<Scale />} tone="lime" />
            <StatCard
              label="Solicitudes"
              value={formatNumber(data.totalRequests)}
              icon={<ClipboardList />}
              hint={`${formatNumber(data.completedRequests)} completadas`}
            />
            <StatCard label="Recolectores verificados" value={formatNumber(data.verifiedGatherers)} icon={<ShieldCheck />} tone="blue" />
            <StatCard
              label="Usuarios"
              value={formatNumber(data.totalUsers)}
              icon={<Users />}
              tone="sand"
              hint={`${formatNumber(data.totalOrganizations)} organizaciones`}
            />
          </div>
        )}
      </QueryBoundary>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Material recuperado por tipo" description="Cantidad registrada por los recolectores." />
          <div className="p-5">
            <QueryBoundary query={residues} rows={3}>
              {(data) =>
                data.length === 0 ? (
                  <EmptyState title="Aún no hay material registrado" />
                ) : (
                  <div className="h-72" role="img" aria-label="Gráfico de barras de material recuperado por tipo">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.map((item) => ({ name: item.residueType ?? 'Sin tipo', quantity: item.recoveredQuantity, unit: item.unit }))} margin={{ left: -10 }}>
                        <CartesianGrid vertical={false} stroke="#dfe6da" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip
                          cursor={{ fill: '#eef8f2' }}
                          formatter={(value, _name, item) => [`${formatNumber(Number(value))} ${(item.payload as { unit: string }).unit ?? ''}`, 'Recuperado']}
                        />
                        <Bar dataKey="quantity" fill="#217a51" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
            </QueryBoundary>
          </div>
        </Card>

        <Card>
          <CardHeader title="Solicitudes por estado" />
          <div className="p-5">
            <QueryBoundary query={requests} rows={3}>
              {(data) =>
                data.length === 0 ? (
                  <EmptyState title="Sin solicitudes" />
                ) : (
                  <>
                    <div className="h-48" role="img" aria-label="Gráfico circular de solicitudes por estado">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byStatus.filter((item) => item.value > 0)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                            {byStatus
                              .filter((item) => item.value > 0)
                              .map((item) => (
                                <Cell key={item.status} fill={statusColors[item.status]} />
                              ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {byStatus.map((item) => (
                        <li key={item.status} className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: statusColors[item.status] }} />
                          <span className="flex-1 text-muted">{item.name}</span>
                          <span className="font-semibold tabular-nums">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )
              }
            </QueryBoundary>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Solicitudes recientes"
            action={
              <ButtonLink to="/app/solicitudes" variant="ghost" size="sm">
                Ver todas
              </ButtonLink>
            }
          />
          <QueryBoundary query={requests} rows={3}>
            {(data) =>
              data.length === 0 ? (
                <EmptyState title="Sin solicitudes" />
              ) : (
                <RequestList requests={data.toSorted((a, b) => b.collectRequestId - a.collectRequestId).slice(0, 5)} detailsByRequest={grouped} showOwner />
              )
            }
          </QueryBoundary>
        </Card>
        <Card>
          <CardHeader title="Mejor calificados" description="Promedio de calificaciones recibidas." />
          <QueryBoundary query={ratings} rows={3}>
            {(data) =>
              data.length === 0 ? (
                <EmptyState title="Aún no hay calificaciones" />
              ) : (
                <ol className="divide-y divide-line">
                  {data
                    .toSorted((a, b) => b.averageScore - a.averageScore)
                    .map((item, index) => (
                      <li key={item.gathererId ?? index} className="flex items-center gap-3 px-5 py-3.5">
                        <span className="grid size-8 place-items-center rounded-full bg-leaf-100 text-sm font-bold text-pine-800">{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{fullName(item)}</p>
                          <p className="text-xs text-muted">{item.totalGrades} calificaciones</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold tabular-nums">{item.averageScore.toFixed(1)}</p>
                          <Rating value={item.averageScore} size="sm" />
                        </div>
                      </li>
                    ))}
                </ol>
              )
            }
          </QueryBoundary>
        </Card>
      </div>
    </>
  )
}

function ResidentDashboard() {
  const { user, organization } = useAuth()
  const requests = useUserRequests(user?.userId)
  const details = useVisibleRequestDetails((requests.data ?? []).map((item) => item.collectRequestId))
  const materials = useVisibleMaterials(details.data.flatMap((item) => item.pickupService ? [item.pickupService.pickupServiceId] : []))
  const grouped = groupDetails(details.data.flatMap((item) => item.details))

  const stats = useMemo(() => {
    const mine = requests.data ?? []
    const kg = materials.filter((item) => item.unitId === 'Kg').reduce((sum, item) => sum + item.quantity, 0)
    return {
      active: mine.filter((item) => item.statusId === 'Pending' || item.statusId === 'Assigned' || item.statusId === 'InProgress').length,
      completed: mine.filter((item) => item.statusId === 'Completed').length,
      kg,
    }
  }, [requests.data, materials])

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.firstName}`}
        description={organization ? `Panel de ${organization.businessName}.` : 'Esto es lo que pasa con tus recojos.'}
        actions={
          <ButtonLink to="/app/solicitudes/nueva">
            <Plus className="size-4" aria-hidden="true" />
            Nueva solicitud
          </ButtonLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recojos activos" value={String(stats.active)} icon={<Truck />} tone="blue" />
        <StatCard label="Recojos completados" value={String(stats.completed)} icon={<CheckCircle2 />} />
        <StatCard label="Material recuperado" value={formatKg(stats.kg)} icon={<Scale />} tone="lime" hint="De tus solicitudes completadas" />
      </div>
      <Card className="mt-6">
        <CardHeader
          title="Últimas solicitudes"
          action={
            <ButtonLink to="/app/solicitudes" variant="ghost" size="sm">
              Ver todas
            </ButtonLink>
          }
        />
        <QueryBoundary query={requests} rows={3}>
          {(data) =>
            data.length === 0 ? (
              <EmptyState
                title="Aún no pediste ningún recojo"
                description="Cuéntanos qué materiales tienes y coordinamos el resto."
                action={<ButtonLink to="/app/solicitudes/nueva">Crear mi primera solicitud</ButtonLink>}
              />
            ) : (
              <RequestList requests={data.toSorted((a, b) => b.collectRequestId - a.collectRequestId).slice(0, 5)} detailsByRequest={grouped} />
            )
          }
        </QueryBoundary>
      </Card>
    </>
  )
}

function GathererDashboard() {
  const { user, gatherer } = useAuth()
  const services = useGathererServices(gatherer?.gathererId)
  const pending = usePendingRequests(gatherer?.verificationStatusId === 'Verified')
  const grades = useOwnGathererGrades(gatherer?.gathererId)
  const myServices = services.data ?? []
  const materials = useVisibleMaterials(myServices.map((item) => item.pickupServiceId))
  const requests = useVisibleRequestDetails(myServices.map((item) => item.collectRequestId))
  const grouped = groupDetails(requests.data.flatMap((item) => item.details))
  const kg = materials.filter((item) => item.unitId === 'Kg').reduce((sum, item) => sum + item.quantity, 0)
  const activeRequests = requests.data.map((item) => item.request).filter((request) =>
    myServices.some((service) => service.collectRequestId === request.collectRequestId && service.statusId !== 'Completed' && service.statusId !== 'Cancelled'),
  )

  return (
    <>
      <PageHeader title={`Hola, ${user?.firstName}`} description="Tus recojos y lo que recuperaste." />
      {gatherer && gatherer.verificationStatusId !== 'Verified' && (
        <div className="mb-6 rounded-xl border border-warn-600/25 bg-warn-50 px-4 py-3 text-sm text-warn-600" role="status">
          <p className="font-semibold">{gatherer.verificationStatusId === 'Pending' ? 'Tu cuenta está en revisión' : 'Tu verificación fue rechazada'}</p>
          <p>
            {gatherer.verificationStatusId === 'Pending'
              ? 'Cuando el equipo apruebe tu documento podrás tomar recojos.'
              : 'Comunícate con el equipo de TrackTrash para revisar tu documento.'}
          </p>
        </div>
      )}
      {!gatherer && (
        <div className="mb-6 rounded-xl border border-warn-600/25 bg-warn-50 px-4 py-3 text-sm text-warn-600" role="status">
          Tu usuario no tiene un perfil de recolector. Pide al equipo que lo registre.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recojos disponibles" value={String(pending.data?.length ?? 0)} icon={<PackageSearch />} tone="blue" />
        <StatCard label="Servicios completados" value={String(myServices.filter((item) => item.statusId === 'Completed').length)} icon={<CheckCircle2 />} />
        <StatCard label="Material recuperado" value={formatKg(kg)} icon={<Scale />} tone="lime" />
        <StatCard
          label="Calificación"
          value={grades.length ? (grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length).toFixed(1) : "Sin calificaciones"}
          icon={<Star />}
          tone="sand"
        />
      </div>
      <Card className="mt-6">
        <CardHeader
          title="En curso"
          action={
            <ButtonLink to="/app/disponibles" variant="ghost" size="sm">
              <Building2 className="size-4" aria-hidden="true" />
              Ver disponibles
            </ButtonLink>
          }
        />
        {activeRequests.length === 0 ? (
          <EmptyState
            title="No tienes recojos en curso"
            description="Revisa los recojos disponibles cerca de ti y toma el que mejor te convenga."
            action={<ButtonLink to="/app/disponibles">Buscar recojos</ButtonLink>}
          />
        ) : (
          <RequestList requests={activeRequests} detailsByRequest={grouped} />
        )}
      </Card>
      <p className="mt-6 text-sm text-muted">
        ¿Dudas con un recojo? Abre su detalle desde <Link to="/app/servicios" className="font-semibold text-leaf-600 hover:underline">Mis servicios</Link>.
      </p>
    </>
  )
}
