import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { labels, residueCategories, type ResidueCategory } from '@/api/enums'
import { collectionPointsApi, locationsApi, residueTypesApi } from '@/api/endpoints'
import { keys, useCollectionPoints, useInvalidatingMutation, useResidueTypes } from '@/api/hooks'
import type { CollectionPoint, ResidueType } from '@/api/schemas'
import { useLookups } from '@/features/requests/lookups'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { EmptyState, Modal, useToast } from '@/components/ui/feedback'
import { Badge, Button, Card, CardHeader, SelectField, TextAreaField, TextField } from '@/components/ui/primitives'
import { PageHeader, QueryBoundary } from '@/components/ui/widgets'

export default function CatalogPage() {
  return (
    <>
      <PageHeader title="Catálogo" description="Materiales aceptados y puntos de acopio visibles para todos." />
      <div className="space-y-6">
        <ResidueSection />
        <PointsSection />
      </div>
    </>
  )
}

function ResidueSection() {
  const query = useResidueTypes()
  const [editing, setEditing] = useState<ResidueType | 'new' | null>(null)
  return (
    <Card>
      <CardHeader
        title="Materiales"
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar
          </Button>
        }
      />
      <QueryBoundary query={query}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState title="Sin materiales" />
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.residueTypeId} className="flex items-center gap-4 px-5 py-3.5">
                  <MaterialIcon kind={materialKind(item.name)} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {item.name}
                      <Badge tone={item.isRecyclable ? 'green' : 'neutral'}>{labels.category[item.residueCategoryId]}</Badge>
                      {!item.isActive && <Badge tone="red">Inactivo</Badge>}
                    </p>
                    {item.classificationInstructions && <p className="truncate text-sm text-muted">{item.classificationInstructions}</p>}
                  </div>
                  <Button size="sm" variant="ghost" aria-label={`Editar ${item.name}`} onClick={() => setEditing(item)}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
      <ResidueDialog editing={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

function ResidueDialog({ editing, onClose }: { editing: ResidueType | 'new' | null; onClose: () => void }) {
  const toast = useToast()
  const current = editing && editing !== 'new' ? editing : null
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ResidueCategory>('Recyclable')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [recyclable, setRecyclable] = useState(true)
  const [active, setActive] = useState(true)
  const [seededFor, setSeededFor] = useState<typeof editing>(null)

  if (editing !== seededFor) {
    setSeededFor(editing)
    setName(current?.name ?? '')
    setCategory(current?.residueCategoryId ?? 'Recyclable')
    setDescription(current?.description ?? '')
    setInstructions(current?.classificationInstructions ?? '')
    setRecyclable(current?.isRecyclable ?? true)
    setActive(current?.isActive ?? true)
  }

  const mutation = useInvalidatingMutation(
    () => {
      const body = {
        name: name.trim(),
        residueCategoryId: category,
        description: description.trim() || null,
        isRecyclable: recyclable,
        classificationInstructions: instructions.trim() || null,
      }
      return current ? residueTypesApi.update(current.residueTypeId, { ...body, isActive: active }) : residueTypesApi.create(body)
    },
    [keys.residueTypes],
  )

  return (
    <Modal open={editing !== null} onClose={onClose} title={current ? 'Editar material' : 'Nuevo material'}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined, {
            onSuccess: () => {
              toast.success('Material guardado.')
              onClose()
            },
            onError: toast.error,
          })
        }}
      >
        <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
        <SelectField label="Categoría" value={category} onChange={(event) => setCategory(event.target.value as ResidueCategory)}>
          {residueCategories.map((item) => (
            <option key={item} value={item}>
              {labels.category[item]}
            </option>
          ))}
        </SelectField>
        <TextField label="Descripción" value={description} onChange={(event) => setDescription(event.target.value)} />
        <TextAreaField label="Instrucciones para separarlo" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recyclable} onChange={(event) => setRecyclable(event.target.checked)} className="size-4 accent-leaf-600" />
          Es reciclable
        </label>
        {current && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="size-4 accent-leaf-600" />
            Activo
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!name.trim()}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function PointsSection() {
  const query = useCollectionPoints()
  const { locationById } = useLookups()
  const [editing, setEditing] = useState<CollectionPoint | 'new' | null>(null)
  return (
    <Card>
      <CardHeader
        title="Puntos de acopio"
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar
          </Button>
        }
      />
      <QueryBoundary query={query}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState title="Sin puntos de acopio" />
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const location = locationById.get(item.locationId)
                return (
                  <li key={item.collectionPointId} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {item.name}
                        {!item.isActive && <Badge tone="red">Inactivo</Badge>}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {location ? `${location.address}, ${location.district}` : 'Sin dirección'}
                        {item.openingHours && ` · ${item.openingHours}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" aria-label={`Editar ${item.name}`} onClick={() => setEditing(item)}>
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )
        }
      </QueryBoundary>
      <PointDialog editing={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

function PointDialog({ editing, onClose }: { editing: CollectionPoint | 'new' | null; onClose: () => void }) {
  const toast = useToast()
  const { locationById } = useLookups()
  const current = editing && editing !== 'new' ? editing : null
  const [form, setForm] = useState({ name: '', managerName: '', phone: '', openingHours: '', description: '', address: '', district: 'Arequipa', latitude: '', longitude: '', isActive: true })
  const [seededFor, setSeededFor] = useState<typeof editing>(null)

  if (editing !== seededFor) {
    setSeededFor(editing)
    const location = current ? locationById.get(current.locationId) : undefined
    setForm({
      name: current?.name ?? '',
      managerName: current?.managerName ?? '',
      phone: current?.phone ?? '',
      openingHours: current?.openingHours ?? '',
      description: current?.description ?? '',
      address: location?.address ?? '',
      district: location?.district ?? 'Arequipa',
      latitude: location?.latitude?.toString() ?? '',
      longitude: location?.longitude?.toString() ?? '',
      isActive: current?.isActive ?? true,
    })
  }
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((value) => ({ ...value, [key]: event.target.value }))

  const mutation = useInvalidatingMutation(
    async () => {
      // A point owns its location; creating a point always creates its location first.
      const locationId = await locationsApi.create({
        address: form.address.trim(),
        district: form.district.trim(),
        province: 'Arequipa',
        department: 'Arequipa',
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      })
      const body = {
        name: form.name.trim(),
        managerName: form.managerName.trim() || null,
        phone: form.phone.trim() || null,
        locationId,
        openingHours: form.openingHours.trim() || null,
        description: form.description.trim() || null,
      }
      return current
        ? collectionPointsApi.update(current.collectionPointId, { ...body, isActive: form.isActive })
        : collectionPointsApi.create(body)
    },
    [keys.collectionPoints, keys.locations],
  )

  return (
    <Modal open={editing !== null} onClose={onClose} title={current ? 'Editar punto de acopio' : 'Nuevo punto de acopio'}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate(undefined, {
            onSuccess: () => {
              toast.success('Punto de acopio guardado.')
              onClose()
            },
            onError: toast.error,
          })
        }}
      >
        <TextField label="Nombre" value={form.name} onChange={set('name')} maxLength={150} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Encargado" value={form.managerName} onChange={set('managerName')} maxLength={120} />
          <TextField label="Teléfono" value={form.phone} onChange={set('phone')} maxLength={20} />
        </div>
        <TextField label="Horario" value={form.openingHours} onChange={set('openingHours')} maxLength={150} placeholder="Lun a Vie 8:00 - 17:00" />
        <TextAreaField label="Descripción" value={form.description} onChange={set('description')} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Dirección" value={form.address} onChange={set('address')} maxLength={250} required />
          <TextField label="Distrito" value={form.district} onChange={set('district')} maxLength={100} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Latitud" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={set('latitude')} />
          <TextField label="Longitud" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={set('longitude')} />
        </div>
        {current && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.checked }))} className="size-4 accent-leaf-600" />
            Activo
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!form.name.trim() || !form.address.trim()}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
