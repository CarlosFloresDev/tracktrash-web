import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { useAllRequestDetails, useAllRequests, useGathererServices } from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { groupDetails, RequestList } from '@/features/requests/RequestList'
import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { EmptyState, Notice } from '@/components/ui/feedback'
import { ButtonLink, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

type Tab = 'active' | 'done'

export default function ServicesPage() {
  const { gatherer } = useAuth()
  const services = useGathererServices(gatherer?.gathererId)
  const requests = useAllRequests()
  const details = useAllRequestDetails()
  const grouped = useMemo(() => groupDetails(details.data), [details.data])
  const [tab, setTab] = useState<Tab>('active')

  if (!gatherer) {
    return (
      <>
        <PageHeader title="Mis servicios" />
        <Notice tone="warn">Tu usuario no tiene perfil de recolector. Pide al equipo que lo registre.</Notice>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Mis servicios" description="Recojos que tomaste, en curso y terminados." />
      <Card>
        <QueryBoundary query={services}>
          {(items) => (
            <QueryBoundary query={requests}>
              {(allRequests) => {
                const done = (status: string) => status === 'Completed' || status === 'Cancelled'
                const wanted = items.filter((item) => (tab === 'active' ? !done(item.statusId) : done(item.statusId)))
                const ids = new Set(wanted.map((item) => item.collectRequestId))
                const visible = allRequests.filter((request) => ids.has(request.collectRequestId)).toSorted((a, b) => b.collectRequestId - a.collectRequestId)
                return (
                  <>
                    <div role="tablist" aria-label="Estado del servicio" className="flex gap-1 border-b border-line px-3 py-2">
                      {([['active', 'En curso'], ['done', 'Terminados']] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="tab"
                          aria-selected={tab === value}
                          onClick={() => setTab(value)}
                          className={clsx('rounded-full px-3.5 py-1.5 text-sm font-medium', tab === value ? 'bg-pine-900 text-white' : 'text-muted hover:bg-leaf-50')}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {visible.length === 0 ? (
                      <EmptyState
                        icon={<EmptyBoxIllustration className="w-24" />}
                        title={tab === 'active' ? 'No tienes servicios en curso' : 'Aún no terminaste servicios'}
                        action={tab === 'active' ? <ButtonLink to="/app/disponibles">Buscar recojos</ButtonLink> : undefined}
                      />
                    ) : (
                      <RequestList requests={visible} detailsByRequest={grouped} />
                    )}
                  </>
                )
              }}
            </QueryBoundary>
          )}
        </QueryBoundary>
      </Card>
    </>
  )
}
