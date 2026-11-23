import { Check, Power, X } from 'lucide-react'
import { labels, type VerificationStatus } from '@/api/enums'
import { gatherersApi } from '@/api/endpoints'
import { keys, useGathererRatings, useGatherers, useInvalidatingMutation } from '@/api/hooks'
import type { Gatherer } from '@/api/schemas'
import { useLookups } from '@/features/requests/lookups'
import { formatDateOnly, fullName } from '@/lib/format'
import { EmptyState, useToast } from '@/components/ui/feedback'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary, Rating, Table, VerificationBadge } from '@/components/ui/widgets'

export default function GatherersPage() {
  const gatherers = useGatherers()
  const ratings = useGathererRatings()
  const { userById } = useLookups({ users: true })
  const toast = useToast()
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
          {(items) =>
            items.length === 0 ? (
              <EmptyState title="Aún no hay recolectores registrados" />
            ) : (
              <Table head={['Recolector', 'Tipo', 'Documento', 'Estado', 'Calificación', 'Acciones']}>
                {items
                  .toSorted((a, b) => a.verificationStatusId.localeCompare(b.verificationStatusId) || b.gathererId - a.gathererId)
                  .map((gatherer) => {
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
            )
          }
        </QueryBoundary>
      </Card>
    </>
  )
}
