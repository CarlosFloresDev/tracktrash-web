import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import type { CollectRequest, RequestDetail } from '@/api/schemas'
import { formatDateOnly, formatKg, formatTimeOnly, fullName } from '@/lib/format'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { StatusBadge } from '@/components/ui/widgets'
import { useLookups } from './lookups'

export function summarizeDetails(details: RequestDetail[]) {
  const kg = details.filter((detail) => detail.unitId === 'Kg').reduce((total, detail) => total + detail.estimatedQuantity, 0)
  return { count: details.length, kg }
}

export function RequestList({
  requests,
  detailsByRequest,
  showOwner = false,
}: {
  requests: CollectRequest[]
  detailsByRequest: Map<number, RequestDetail[]>
  showOwner?: boolean
}) {
  const { locationById, residueById, userById } = useLookups({ users: showOwner })

  return (
    <ul className="divide-y divide-line">
      {requests.map((request) => {
        const location = locationById.get(request.locationId)
        const details = detailsByRequest.get(request.collectRequestId) ?? []
        const { kg } = summarizeDetails(details)
        const first = details[0] ? residueById.get(details[0].residueTypeId) : undefined
        const owner = showOwner ? userById.get(request.userId) : undefined
        return (
          <li key={request.collectRequestId}>
            <Link
              to={`/app/solicitudes/${request.collectRequestId}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-leaf-50/60"
            >
              <MaterialIcon kind={first ? materialKind(first.name) : 'other'} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="font-semibold">Solicitud #{request.collectRequestId}</p>
                  <StatusBadge status={request.statusId} />
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {formatDateOnly(request.scheduledDate)}, {formatTimeOnly(request.scheduledTime)}
                  </span>
                  {location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {location.address}, {location.district}
                    </span>
                  )}
                </p>
                {(owner || details.length > 0) && (
                  <p className="mt-0.5 text-sm text-muted">
                    {owner && <span>{fullName(owner)}</span>}
                    {owner && details.length > 0 && <span> · </span>}
                    {details.length > 0 && (
                      <span>
                        {details.length} {details.length === 1 ? 'material' : 'materiales'}
                        {kg > 0 && `, ${formatKg(kg)} estimados`}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function groupDetails(details: RequestDetail[] | undefined): Map<number, RequestDetail[]> {
  const grouped = new Map<number, RequestDetail[]>()
  for (const detail of details ?? []) {
    const list = grouped.get(detail.collectRequestId)
    if (list) list.push(detail)
    else grouped.set(detail.collectRequestId, [detail])
  }
  return grouped
}
