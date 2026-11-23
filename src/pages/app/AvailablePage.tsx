import { useMemo } from 'react'
import { useAllRequestDetails, usePendingRequests } from '@/api/hooks'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { EmptyState } from '@/components/ui/feedback'
import { Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

export default function AvailablePage() {
  const pending = usePendingRequests()
  const details = useAllRequestDetails()
  const grouped = useMemo(() => groupDetails(details.data), [details.data])

  return (
    <>
      <PageHeader title="Recojos disponibles" description="Solicitudes pendientes que aún no tienen recolector. Abre una para ver los detalles y tomarla." />
      <Card>
        <QueryBoundary query={pending}>
          {(requests) =>
            requests.length === 0 ? (
              <EmptyState
                icon={<EmptyBoxIllustration className="w-24" />}
                title="No hay recojos pendientes"
                description="Cuando alguien pida un recojo aparecerá aquí."
              />
            ) : (
              <RequestList
                requests={requests.toSorted((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))}
                detailsByRequest={grouped}
              />
            )
          }
        </QueryBoundary>
      </Card>
    </>
  )
}
