import { useAuth } from '@/features/auth/auth'
import { useVisibleRequestDetails, usePendingRequests } from '@/api/hooks'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { EmptyState } from '@/components/ui/feedback'
import { Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

export default function AvailablePage() {
  const { gatherer } = useAuth()
  const pending = usePendingRequests(gatherer?.verificationStatusId === 'Verified')
  const details = useVisibleRequestDetails((pending.data ?? []).map((item) => item.collectRequestId))
  const grouped = groupDetails(details.data.flatMap((item) => item.details))

  if (gatherer?.verificationStatusId !== 'Verified') {
    return <PageHeader title="Recojos disponibles" description="Necesitas un perfil de recolector verificado para ver los recojos." />
  }

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
