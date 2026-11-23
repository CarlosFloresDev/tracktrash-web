import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, PackagePlus, Play, Star, Truck, XCircle } from 'lucide-react'
import { labels, isFinalStatus, measurementUnits } from '@/api/enums'
import { gradesApi, pickupServicesApi, recoveredMaterialsApi, requestsApi, usersApi } from '@/api/endpoints'
import {
  keys,
  useGatherers,
  useInvalidatingMutation,
  useMyGrade,
  useRequestFull,
  useRequestHistory,
  useServiceMaterials,
} from '@/api/hooks'
import type { CollectRequestFull, Gatherer } from '@/api/schemas'
import { useAuth } from '@/features/auth/auth'
import { useLookups } from '@/features/requests/lookups'
import { formatDateOnly, formatDateTime, formatNumber, formatTimeOnly, fullName } from '@/lib/format'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { PointsMap } from '@/components/map/PointsMap'
import { ErrorState, ListSkeleton, Modal, Notice, useToast } from '@/components/ui/feedback'
import { Button, Card, CardHeader, SelectField, TextAreaField, TextField } from '@/components/ui/primitives'
import { DefinitionList, PageHeader, Rating, RatingInput, StatusBadge, Timeline } from '@/components/ui/widgets'

/** Commission used when a gatherer takes a request themselves. The business rule lives outside this client. */
const DEFAULT_COMMISSION = 10

type Dialog = null | 'cancel' | 'assign' | 'material' | 'rate' | 'cancelService'

function PersonName({ userId }: { userId: number }) {
  const query = useQuery({ queryKey: ['users', userId], queryFn: () => usersApi.byId(userId), staleTime: 5 * 60_000 })
  return <>{query.data ? fullName(query.data) : '...'}</>
}

export default function RequestDetailPage() {
  const id = Number(useParams().id)
  const { user, gatherer: ownGatherer } = useAuth()
  const toast = useToast()
  const query = useRequestFull(id)
  const history = useRequestHistory(id)
  const lookups = useLookups()
  const [dialog, setDialog] = useState<Dialog>(null)

  const service = query.data?.pickupService ?? null
  const materials = useServiceMaterials(service?.pickupServiceId)
  const myGrade = useMyGrade(service?.pickupServiceId, user?.userId ?? 0)

  const cancelRequest = useInvalidatingMutation((observations: string | null) =>
    requestsApi.changeStatus(id, { newStatusId: 'Cancelled', changedByUserId: user?.userId, observations }),
  )
  const cancelService = useInvalidatingMutation((input: { serviceId: number; reason: string | null }) =>
    pickupServicesApi.changeStatus(input.serviceId, { newStatusId: 'Cancelled', changedByUserId: user?.userId, observations: input.reason }),
  )

  if (!user) return null
  if (Number.isNaN(id)) return <ErrorState error={new Error('Solicitud no válida')} />
  if (query.isPending || lookups.isPending) return <ListSkeleton rows={5} />
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />

  const data: CollectRequestFull = query.data
  const { request, location, details } = data
  const isOwner = request.userId === user.userId
  const isAdmin = user.roleId === 'Admin'
  const isServiceGatherer = service !== null && ownGatherer !== null && service.gathererId === ownGatherer.gathererId
  const canTake =
    user.roleId === 'Gatherer' && request.statusId === 'Pending' && service === null && ownGatherer?.verificationStatusId === 'Verified' && ownGatherer.isActive
  const gathererBlocked = user.roleId === 'Gatherer' && ownGatherer !== null && !(ownGatherer.verificationStatusId === 'Verified' && ownGatherer.isActive)
  const serviceActive = service !== null && !isFinalStatus(service.statusId)
  const canRate = isOwner && service?.statusId === 'Completed' && myGrade.data === null

  const timeline = (history.data ?? [])
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((entry) => ({
      id: entry.requestHistoryId,
      title: entry.previousStatusId
        ? `${labels.status[entry.previousStatusId]} a ${labels.status[entry.newStatusId]}`
        : `Solicitud ${labels.status[entry.newStatusId].toLowerCase()}`,
      detail: entry.observations,
      at: entry.createdAt,
      status: entry.newStatusId,
    }))

  return (
    <>
      <Link to="/app/solicitudes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-leaf-600 hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a solicitudes
      </Link>
      <PageHeader
        title={`Solicitud #${request.collectRequestId}`}
        description={`Pedida el ${formatDateTime(request.requestedAt)}`}
        actions={<StatusBadge status={request.statusId} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Recojo" />
            <div className="space-y-5 p-5">
              <DefinitionList
                items={[
                  {
                    label: 'Fecha y hora',
                    value: (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4 text-leaf-600" aria-hidden="true" />
                        {formatDateOnly(request.scheduledDate)}
                        <Clock className="ml-2 size-4 text-leaf-600" aria-hidden="true" />
                        {formatTimeOnly(request.scheduledTime)}
                      </span>
                    ),
                  },
                  {
                    label: 'Dirección',
                    value: (
                      <span className="inline-flex items-start gap-1.5">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
                        <span>
                          {location.address}, {location.district}
                          {location.reference && <span className="block text-muted">{location.reference}</span>}
                        </span>
                      </span>
                    ),
                  },
                  ...(isAdmin || !isOwner ? [{ label: 'Solicitante', value: <PersonName userId={request.userId} /> }] : []),
                  ...(request.observations ? [{ label: 'Indicaciones', value: request.observations }] : []),
                ]}
              />
              {location.latitude !== null && location.longitude !== null && (
                <div className="overflow-hidden rounded-xl border border-line">
                  <PointsMap
                    className="h-56 w-full"
                    points={[{ id: location.locationId, name: location.address, latitude: location.latitude, longitude: location.longitude, subtitle: location.district }]}
                    selectedId={location.locationId}
                  />
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Materiales estimados" />
            {details.length === 0 ? (
              <p className="p-5 text-sm text-muted">Esta solicitud no tiene materiales registrados.</p>
            ) : (
              <ul className="divide-y divide-line">
                {details.map((detail) => {
                  const residue = lookups.residueById.get(detail.residueTypeId)
                  return (
                    <li key={detail.requestDetailId} className="flex items-center gap-4 px-5 py-3.5">
                      <MaterialIcon kind={residue ? materialKind(residue.name) : 'other'} />
                      <div className="flex-1">
                        <p className="font-medium">{residue?.name ?? `Material #${detail.residueTypeId}`}</p>
                        {residue?.classificationInstructions && <p className="text-sm text-muted">{residue.classificationInstructions}</p>}
                      </div>
                      <p className="font-display text-lg font-semibold tabular-nums">
                        {formatNumber(detail.estimatedQuantity)} <span className="text-sm font-medium text-muted">{labels.unit[detail.unitId]}</span>
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {service && (
            <Card>
              <CardHeader
                title="Material recuperado"
                description="Lo que el recolector registró al recoger."
                action={
                  isServiceGatherer && service.statusId === 'InProgress' ? (
                    <Button size="sm" onClick={() => setDialog('material')}>
                      <PackagePlus className="size-4" aria-hidden="true" />
                      Registrar
                    </Button>
                  ) : undefined
                }
              />
              {materials.isPending ? (
                <ListSkeleton rows={2} />
              ) : (materials.data ?? []).length === 0 ? (
                <p className="p-5 text-sm text-muted">Aún no se registra material recuperado.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {materials.data!.map((material) => {
                    const residue = lookups.residueById.get(material.residueTypeId)
                    return (
                      <li key={material.recoveredMaterialId} className="flex items-center gap-4 px-5 py-3.5">
                        <MaterialIcon kind={residue ? materialKind(residue.name) : 'other'} />
                        <p className="flex-1 font-medium">{residue?.name ?? `Material #${material.residueTypeId}`}</p>
                        <p className="font-display text-lg font-semibold tabular-nums">
                          {formatNumber(material.quantity)} <span className="text-sm font-medium text-muted">{labels.unit[material.unitId]}</span>
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Acciones" />
            <div className="space-y-3 p-5">
              {gathererBlocked && (
                <Notice tone="warn" title="Tu cuenta aún no está verificada">
                  Podrás tomar recojos cuando el equipo apruebe tu documento.
                </Notice>
              )}
              {canTake && (
                <TakeButton
                  requestId={request.collectRequestId}
                  gatherer={ownGatherer}
                  userId={user.userId}
                />
              )}
              {isServiceGatherer && service.statusId === 'Assigned' && (
                <ServiceStatusButton serviceId={service.pickupServiceId} next="InProgress" userId={user.userId} icon={<Play className="size-4" />}>
                  Iniciar recojo
                </ServiceStatusButton>
              )}
              {isServiceGatherer && service.statusId === 'InProgress' && (
                <ServiceStatusButton
                  serviceId={service.pickupServiceId}
                  next="Completed"
                  userId={user.userId}
                  icon={<CheckCircle2 className="size-4" />}
                  disabled={(materials.data ?? []).length === 0}
                >
                  Finalizar recojo
                </ServiceStatusButton>
              )}
              {isServiceGatherer && service.statusId === 'InProgress' && (materials.data ?? []).length === 0 && (
                <p className="text-sm text-muted">Registra al menos un material recuperado para finalizar.</p>
              )}
              {isServiceGatherer && serviceActive && (
                <Button variant="secondary" className="w-full" onClick={() => setDialog('cancelService')}>
                  Soltar este recojo
                </Button>
              )}
              {isAdmin && request.statusId === 'Pending' && service === null && (
                <Button className="w-full" onClick={() => setDialog('assign')}>
                  <Truck className="size-4" aria-hidden="true" />
                  Asignar recolector
                </Button>
              )}
              {canRate && (
                <Button className="w-full" onClick={() => setDialog('rate')}>
                  <Star className="size-4" aria-hidden="true" />
                  Calificar servicio
                </Button>
              )}
              {myGrade.data && (
                <div className="rounded-xl bg-leaf-50 p-3 text-sm">
                  <p className="font-semibold">Tu calificación</p>
                  <Rating value={myGrade.data.score} />
                  {myGrade.data.comment && <p className="mt-1 text-muted">{myGrade.data.comment}</p>}
                </div>
              )}
              {(isOwner || isAdmin) && !isFinalStatus(request.statusId) && (
                <Button variant="danger" className="w-full" onClick={() => setDialog('cancel')}>
                  <XCircle className="size-4" aria-hidden="true" />
                  Cancelar solicitud
                </Button>
              )}
              {isFinalStatus(request.statusId) && !canRate && !myGrade.data && (
                <p className="text-sm text-muted">Esta solicitud ya terminó. No hay acciones pendientes.</p>
              )}
            </div>
          </Card>

          {service && (
            <Card>
              <CardHeader title="Recolector" />
              <div className="space-y-3 p-5">
                <GathererSummary gathererId={service.gathererId} />
                <DefinitionList
                  items={[
                    { label: 'Estado', value: <StatusBadge status={service.statusId} /> },
                    { label: 'Asignado', value: formatDateTime(service.assignedAt) },
                    ...(service.startedAt ? [{ label: 'Inició', value: formatDateTime(service.startedAt) }] : []),
                    ...(service.completedAt ? [{ label: 'Terminó', value: formatDateTime(service.completedAt) }] : []),
                  ]}
                />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Historial" />
            <div className="p-5">
              {history.isPending ? <ListSkeleton rows={2} /> : timeline.length === 0 ? <p className="text-sm text-muted">Sin movimientos todavía.</p> : <Timeline entries={timeline} />}
            </div>
          </Card>
        </div>
      </div>

      <CancelDialog
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        title="Cancelar solicitud"
        confirmLabel="Cancelar solicitud"
        onConfirm={async (reason) => {
          try {
            // An active service must be released first; the backend then returns the request to Pending.
            if (service && serviceActive) await cancelService.mutateAsync({ serviceId: service.pickupServiceId, reason })
            await cancelRequest.mutateAsync(reason)
            toast.success('Solicitud cancelada.')
            setDialog(null)
          } catch (error) {
            toast.error(error)
          }
        }}
      />
      <CancelDialog
        open={dialog === 'cancelService'}
        onClose={() => setDialog(null)}
        title="Soltar recojo"
        confirmLabel="Soltar recojo"
        description="La solicitud volverá a quedar disponible para otros recolectores."
        onConfirm={async (reason) => {
          if (!service) return
          try {
            await cancelService.mutateAsync({ serviceId: service.pickupServiceId, reason })
            toast.success('Soltaste el recojo.')
            setDialog(null)
          } catch (error) {
            toast.error(error)
          }
        }}
      />
      <AssignDialog open={dialog === 'assign'} onClose={() => setDialog(null)} requestId={request.collectRequestId} adminId={user.userId} />
      {service && (
        <MaterialDialog open={dialog === 'material'} onClose={() => setDialog(null)} serviceId={service.pickupServiceId} />
      )}
      {service && <RateDialog open={dialog === 'rate'} onClose={() => setDialog(null)} serviceId={service.pickupServiceId} userId={user.userId} />}
    </>
  )
}

function GathererSummary({ gathererId }: { gathererId: number }) {
  const gatherers = useGatherers()
  const gatherer = gatherers.data?.find((item) => item.gathererId === gathererId)
  if (!gatherer) return <p className="font-semibold">Recolector #{gathererId}</p>
  return (
    <>
      <p className="font-semibold">
        <PersonName userId={gatherer.userId} />
      </p>
      <p className="text-sm text-muted">
        {labels.gathererType[gatherer.gathererTypeId]}
        {gatherer.description && `. ${gatherer.description}`}
      </p>
    </>
  )
}

function TakeButton({ requestId, gatherer, userId }: { requestId: number; gatherer: Gatherer; userId: number }) {
  const toast = useToast()
  const mutation = useInvalidatingMutation(() =>
    pickupServicesApi.create({
      collectRequestId: requestId,
      gathererId: gatherer.gathererId,
      commissionPercentage: DEFAULT_COMMISSION,
      assignedByUserId: userId,
    }),
  )
  return (
    <Button
      className="w-full"
      loading={mutation.isPending}
      onClick={() => mutation.mutate(undefined, { onSuccess: () => toast.success('Tomaste este recojo.'), onError: toast.error })}
    >
      <Truck className="size-4" aria-hidden="true" />
      Tomar este recojo
    </Button>
  )
}

function ServiceStatusButton({
  serviceId,
  next,
  userId,
  icon,
  children,
  disabled,
}: {
  serviceId: number
  next: 'InProgress' | 'Completed'
  userId: number
  icon: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
}) {
  const toast = useToast()
  const mutation = useInvalidatingMutation(() => pickupServicesApi.changeStatus(serviceId, { newStatusId: next, changedByUserId: userId }))
  return (
    <Button
      className="w-full"
      disabled={disabled}
      loading={mutation.isPending}
      onClick={() => mutation.mutate(undefined, { onSuccess: () => toast.success('Estado actualizado.'), onError: toast.error })}
    >
      {icon}
      {children}
    </Button>
  )
}

function CancelDialog({
  open,
  onClose,
  title,
  confirmLabel,
  description,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  confirmLabel: string
  description?: string
  onConfirm: (reason: string | null) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {description && <p className="text-sm text-muted">{description}</p>}
        <TextAreaField label="Motivo (opcional)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Volver
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await onConfirm(reason.trim() || null)
              setBusy(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AssignDialog({ open, onClose, requestId, adminId }: { open: boolean; onClose: () => void; requestId: number; adminId: number }) {
  const toast = useToast()
  const gatherers = useGatherers()
  const [gathererId, setGathererId] = useState('')
  const [commission, setCommission] = useState('10')
  const mutation = useInvalidatingMutation(() =>
    pickupServicesApi.create({
      collectRequestId: requestId,
      gathererId: Number(gathererId),
      commissionPercentage: Number(commission),
      assignedByUserId: adminId,
    }),
  )
  const eligible = (gatherers.data ?? []).filter((item) => item.verificationStatusId === 'Verified' && item.isActive)
  return (
    <Modal open={open} onClose={onClose} title="Asignar recolector">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined, {
            onSuccess: () => {
              toast.success('Recolector asignado.')
              onClose()
            },
            onError: toast.error,
          })
        }}
      >
        <SelectField label="Recolector" value={gathererId} onChange={(event) => setGathererId(event.target.value)} required>
          <option value="">Elige un recolector verificado</option>
          {eligible.map((item) => (
            <option key={item.gathererId} value={item.gathererId}>
              Recolector #{item.gathererId} ({labels.gathererType[item.gathererTypeId]})
            </option>
          ))}
        </SelectField>
        <TextField
          label="Comisión (%)"
          type="number"
          min={0}
          max={100}
          step="0.5"
          value={commission}
          onChange={(event) => setCommission(event.target.value)}
          required
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!gathererId}>
            Asignar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function MaterialDialog({ open, onClose, serviceId }: { open: boolean; onClose: () => void; serviceId: number }) {
  const toast = useToast()
  const lookups = useLookups()
  const [residueTypeId, setResidueTypeId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<(typeof measurementUnits)[number]>('Kg')
  const mutation = useInvalidatingMutation(
    () =>
      recoveredMaterialsApi.create({ pickupServiceId: serviceId, residueTypeId: Number(residueTypeId), quantity: Number(quantity), unitId: unit }),
    [keys.allMaterials, keys.materials(serviceId), keys.indicators],
  )
  return (
    <Modal open={open} onClose={onClose} title="Registrar material recuperado">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined, {
            onSuccess: () => {
              toast.success('Material registrado.')
              setQuantity('')
              onClose()
            },
            onError: toast.error,
          })
        }}
      >
        <SelectField label="Material" value={residueTypeId} onChange={(event) => setResidueTypeId(event.target.value)} required>
          <option value="">Elige uno</option>
          {[...lookups.residueById.values()]
            .filter((item) => item.isActive)
            .map((item) => (
              <option key={item.residueTypeId} value={item.residueTypeId}>
                {item.name}
              </option>
            ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Cantidad real" type="number" min="0.01" max="100000" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          <SelectField label="Unidad" value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}>
            {measurementUnits.map((item) => (
              <option key={item} value={item}>
                {labels.unit[item]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!residueTypeId || !quantity}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function RateDialog({ open, onClose, serviceId, userId }: { open: boolean; onClose: () => void; serviceId: number; userId: number }) {
  const toast = useToast()
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const mutation = useInvalidatingMutation(
    () => gradesApi.create({ pickupServiceId: serviceId, userId, score, comment: comment.trim() || null }),
    [keys.grades, keys.gathererGrades, keys.indicators],
  )
  return (
    <Modal open={open} onClose={onClose} title="Califica el servicio">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined, {
            onSuccess: () => {
              toast.success('Gracias por tu calificación.')
              onClose()
            },
            onError: toast.error,
          })
        }}
      >
        <RatingInput value={score} onChange={setScore} />
        <TextAreaField label="Comentario (opcional)" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={score === 0}>
            Enviar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
