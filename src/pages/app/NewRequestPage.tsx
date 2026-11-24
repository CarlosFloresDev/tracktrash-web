import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { LocateFixed, Plus, Trash2 } from 'lucide-react'
import { labels, measurementUnits } from '@/api/enums'
import { locationsApi, requestsApi } from '@/api/endpoints'
import { keys, useLocations, useResidueTypes } from '@/api/hooks'
import { useAuth } from '@/features/auth/auth'
import { todayIso } from '@/lib/format'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { errorMessage, Notice, useToast } from '@/components/ui/feedback'
import { Button, Card, CardHeader, SelectField, TextAreaField, TextField } from '@/components/ui/primitives'
import { PageHeader } from '@/components/ui/widgets'

const schema = z
  .object({
    addressMode: z.enum(['saved', 'new']),
    address: z.string().trim().max(250).optional(),
    district: z.string().trim().optional(),
    reference: z.string().trim().max(250).optional(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    scheduledDate: z.string().min(1, 'Elige una fecha'),
    scheduledTime: z.string().min(1, 'Elige una hora'),
    observations: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          residueTypeId: z.string().min(1, 'Elige un material'),
          quantity: z.number({ error: 'Ingresa una cantidad' }).min(0.01, 'Mínimo 0.01').max(100000, 'Máximo 100000'),
          unit: z.enum(measurementUnits),
        }),
      )
      .min(1, 'Agrega al menos un material'),
  })
  .superRefine((values, ctx) => {
    if (values.addressMode === 'new') {
      if (!values.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Indica la dirección' })
      if (!values.district) ctx.addIssue({ code: 'custom', path: ['district'], message: 'Indica el distrito' })
    }
    if (values.scheduledDate && values.scheduledDate < todayIso()) {
      ctx.addIssue({ code: 'custom', path: ['scheduledDate'], message: 'La fecha no puede estar en el pasado' })
    }
  })
type FormValues = z.infer<typeof schema>

export default function NewRequestPage() {
  const { user, organization } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const residues = useResidueTypes()
  const locations = useLocations()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const savedLocation = locations.data?.find((location) => location.locationId === user?.locationId)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      addressMode: user?.locationId ? 'saved' : 'new',
      district: 'Arequipa',
      latitude: null,
      longitude: null,
      scheduledDate: '',
      scheduledTime: '09:00',
      items: [{ residueTypeId: '', quantity: 1, unit: 'Kg' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const addressMode = useWatch({ control, name: 'addressMode' })
  const latitude = useWatch({ control, name: 'latitude' })
  const watchedItems = useWatch({ control, name: 'items' })

  if (!user) return null
  const activeResidues = residues.data?.filter((item) => item.isActive && item.isRecyclable) ?? []

  function locate() {
    if (!navigator.geolocation) return toast.error(new Error('Tu navegador no permite obtener la ubicación.'))
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', Number(position.coords.latitude.toFixed(6)))
        setValue('longitude', Number(position.coords.longitude.toFixed(6)))
        setLocating(false)
        toast.success('Ubicación capturada.')
      },
      () => {
        setLocating(false)
        toast.error(new Error('No pudimos obtener tu ubicación. Puedes continuar sin ella.'))
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    try {
      let locationId = user!.locationId
      if (values.addressMode === 'new' || locationId === null) {
        locationId = await locationsApi.create({
          address: values.address!,
          reference: values.reference || null,
          district: values.district!,
          province: 'Arequipa',
          department: 'Arequipa',
          latitude: values.latitude,
          longitude: values.longitude,
        })
      }
      const requestId = await requestsApi.create({
        organizationId: organization?.organizationId ?? null,
        locationId,
        scheduledDate: values.scheduledDate,
        scheduledTime: `${values.scheduledTime}:00`,
        observations: values.observations || null,
        details: values.items.map((item) => ({
          residueTypeId: Number(item.residueTypeId),
          estimatedQuantity: item.quantity,
          unitId: item.unit,
        })),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.requests }),
        queryClient.invalidateQueries({ queryKey: keys.requestDetails }),
        queryClient.invalidateQueries({ queryKey: keys.locations }),
      ])
      toast.success('Solicitud creada. Podras revisar las postulaciones en el detalle.')
      navigate(`/app/solicitudes/${requestId}`)
    } catch (cause) {
      setSubmitError(errorMessage(cause))
    }
  }

  return (
    <>
      <PageHeader title="Nueva solicitud" description="Cuéntanos qué tienes y cuándo podemos pasar a recogerlo." />
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Materiales" description="Una fila por cada tipo de material." />
            <div className="space-y-4 p-5">
              {fields.map((field, index) => {
                const selected = activeResidues.find((item) => String(item.residueTypeId) === watchedItems?.[index]?.residueTypeId)
                return (
                  <div key={field.id} className="rounded-xl border border-line p-4">
                    <div className="flex items-start gap-3">
                      <MaterialIcon kind={selected ? materialKind(selected.name) : 'other'} />
                      <div className="grid flex-1 gap-3 sm:grid-cols-[1.6fr_1fr_1fr]">
                        <SelectField label="Material" error={errors.items?.[index]?.residueTypeId?.message} {...register(`items.${index}.residueTypeId`)}>
                          <option value="">Elige uno</option>
                          {activeResidues.map((item) => (
                            <option key={item.residueTypeId} value={item.residueTypeId}>
                              {item.name}
                            </option>
                          ))}
                        </SelectField>
                        <TextField
                          label="Cantidad"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          error={errors.items?.[index]?.quantity?.message}
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        <SelectField label="Unidad" {...register(`items.${index}.unit`)}>
                          {measurementUnits.map((unit) => (
                            <option key={unit} value={unit}>
                              {labels.unit[unit]}
                            </option>
                          ))}
                        </SelectField>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          aria-label={`Quitar material ${index + 1}`}
                          className="mt-7 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    {selected?.classificationInstructions && (
                      <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-sm text-pine-800">{selected.classificationInstructions}</p>
                    )}
                  </div>
                )
              })}
              {errors.items?.root?.message && <p role="alert" className="text-sm text-danger-600">{errors.items.root.message}</p>}
              {errors.items?.message && <p role="alert" className="text-sm text-danger-600">{errors.items.message}</p>}
              <Button variant="secondary" size="sm" onClick={() => append({ residueTypeId: '', quantity: 1, unit: 'Kg' })}>
                <Plus className="size-4" aria-hidden="true" />
                Agregar otro material
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Dirección de recojo" />
            <div className="space-y-4 p-5">
              {savedLocation && (
                <Controller
                  control={control}
                  name="addressMode"
                  render={({ field }) => (
                    <fieldset className="space-y-2">
                      <legend className="sr-only">Dirección</legend>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-leaf-600 has-[:checked]:bg-leaf-50">
                        <input type="radio" className="mt-1 accent-leaf-600" checked={field.value === 'saved'} onChange={() => field.onChange('saved')} />
                        <span>
                          <span className="block text-sm font-semibold">Mi dirección registrada</span>
                          <span className="text-sm text-muted">
                            {savedLocation.address}, {savedLocation.district}
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-leaf-600 has-[:checked]:bg-leaf-50">
                        <input type="radio" className="mt-1 accent-leaf-600" checked={field.value === 'new'} onChange={() => field.onChange('new')} />
                        <span className="text-sm font-semibold">Otra dirección</span>
                      </label>
                    </fieldset>
                  )}
                />
              )}
              {addressMode === 'new' && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Dirección" autoComplete="street-address" error={errors.address?.message} {...register('address')} />
                    <TextField label="Distrito" error={errors.district?.message} {...register('district')} />
                  </div>
                  <TextField label="Referencia (opcional)" hint="Ej. frente al parque, portón verde" error={errors.reference?.message} {...register('reference')} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={locate} loading={locating}>
                      <LocateFixed className="size-4" aria-hidden="true" />
                      Usar mi ubicación actual
                    </Button>
                    {latitude !== null && <span className="text-sm text-leaf-600">Coordenadas guardadas</span>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Cuándo" />
            <div className="space-y-4 p-5">
              <TextField label="Fecha" type="date" min={todayIso()} error={errors.scheduledDate?.message} {...register('scheduledDate')} />
              <TextField label="Hora" type="time" error={errors.scheduledTime?.message} {...register('scheduledTime')} />
              <TextAreaField label="Indicaciones (opcional)" hint="Cómo ubicarte, horarios de portería, etc." error={errors.observations?.message} {...register('observations')} />
            </div>
          </Card>
          {organization && <Notice tone="info">Esta solicitud se registrará a nombre de {organization.businessName}.</Notice>}
          {submitError && <Notice tone="warn" title="No pudimos crear la solicitud">{submitError}</Notice>}
          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Enviar solicitud
          </Button>
        </div>
      </form>
    </>
  )
}
