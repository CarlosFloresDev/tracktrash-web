import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { labels, requestStatuses, type RequestStatus } from '@/api/enums'
import { useAllRequestDetails, useAllRequests, useUserRequests } from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { EmptyState } from '@/components/ui/feedback'
import { ButtonLink, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

type Filter = 'all' | RequestStatus

export default function RequestsPage() {
  const { user } = useAuth()
  const isAdmin = user?.roleId === 'Admin'
  const mine = useUserRequests(isAdmin ? undefined : user?.userId)
  const all = useAllRequests()
  const query = isAdmin ? all : mine
  const details = useAllRequestDetails()
  const [filter, setFilter] = useState<Filter>('all')
  const grouped = useMemo(() => groupDetails(details.data), [details.data])

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
            const visible = requests
              .filter((item) => filter === 'all' || item.statusId === filter)
              .toSorted((a, b) => b.collectRequestId - a.collectRequestId)
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
                {visible.length === 0 ? (
                  <EmptyState
                    icon={<EmptyBoxIllustration className="w-24" />}
                    title={filter === 'all' ? 'Aún no hay solicitudes' : 'No hay solicitudes en este estado'}
                    description={!isAdmin && filter === 'all' ? 'Pide tu primer recojo en menos de dos minutos.' : undefined}
                    action={
                      !isAdmin && filter === 'all' ? <ButtonLink to="/app/solicitudes/nueva">Crear solicitud</ButtonLink> : undefined
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
