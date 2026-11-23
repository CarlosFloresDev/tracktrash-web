import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, MapPinned, Scale, ShieldCheck, Sprout, Truck } from 'lucide-react'
import { useGeneralIndicators, useResidueTypes } from '@/api/hooks'
import { labels } from '@/api/enums'
import { formatNumber } from '@/lib/format'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { RouteDiagram, SkylineScene } from '@/components/brand/Illustrations'
import { ButtonLink } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/primitives'

const steps = [
  {
    icon: CalendarCheck,
    title: 'Pide tu recojo',
    text: 'Indica qué materiales tienes, cuánto estimas y cuándo te conviene. Toma menos de dos minutos.',
  },
  {
    icon: Truck,
    title: 'Un recolector verificado va por ellos',
    text: 'Asignamos tu solicitud a un recolector con documentos validados y seguimos cada cambio de estado.',
  },
  {
    icon: Scale,
    title: 'Medimos lo recuperado',
    text: 'El recolector registra los kilos reales y tú calificas el servicio. Todo queda en tu historial.',
  },
]

const audiences = [
  {
    title: 'Hogares',
    text: 'Programa recojos de papel, plástico, vidrio y metal sin salir de casa.',
    to: '/registro',
    cta: 'Registrarme como hogar',
  },
  {
    title: 'Organizaciones',
    text: 'Colegios, restaurantes y empresas con volúmenes recurrentes, planes y trazabilidad.',
    to: '/registro',
    cta: 'Registrar mi organización',
  },
  {
    title: 'Recolectores',
    text: 'Recibe recojos cercanos, registra lo recuperado y construye reputación con calificaciones.',
    to: '/registro',
    cta: 'Unirme como recolector',
  },
]

function ImpactNumbers() {
  const query = useGeneralIndicators()
  if (query.isError) return null
  const items = query.data
    ? [
        { label: 'kg recuperados', value: formatNumber(query.data.recoveredKilograms) },
        { label: 'recojos completados', value: formatNumber(query.data.completedServices) },
        { label: 'recolectores verificados', value: formatNumber(query.data.verifiedGatherers) },
        { label: 'organizaciones', value: formatNumber(query.data.totalOrganizations) },
      ]
    : null
  return (
    <section aria-label="Impacto de TrackTrash" className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-card md:grid-cols-4">
        {(items ?? Array.from({ length: 4 }, () => null)).map((item, index) => (
          <div key={item?.label ?? index} className="bg-white px-5 py-6 text-center">
            {item ? (
              <>
                <dd className="font-display text-3xl font-bold tabular-nums text-pine-900 sm:text-4xl">{item.value}</dd>
                <dt className="mt-1 text-sm text-muted">{item.label}</dt>
              </>
            ) : (
              <Skeleton className="mx-auto h-12 w-24" />
            )}
          </div>
        ))}
      </dl>
    </section>
  )
}

function Materials() {
  const query = useResidueTypes()
  const recyclable = query.data?.filter((item) => item.isActive).slice(0, 8) ?? []
  if (query.isError) return null
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {query.isPending
        ? Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-36" />
            </li>
          ))
        : recyclable.map((item) => (
            <li key={item.residueTypeId} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <MaterialIcon kind={materialKind(item.name)} />
              <h3 className="mt-4 font-display text-lg font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-muted">{item.classificationInstructions ?? item.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-leaf-600">
                {labels.category[item.residueCategoryId]}
              </p>
            </li>
          ))}
    </ul>
  )
}

export function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-paper">
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[26rem] opacity-90 sm:h-[30rem]">
          <SkylineScene className="size-full" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-28 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-36 md:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-leaf-100 px-3.5 py-1.5 text-sm font-semibold text-pine-800">
              <Sprout className="size-4" aria-hidden="true" />
              Reciclaje coordinado en Arequipa
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Tus residuos reciclables, <span className="text-leaf-600">recogidos y medidos.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              TrackTrash conecta hogares, colegios y negocios con recolectores verificados. Pides el recojo, sigues el
              estado y ves cuántos kilos se recuperaron.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/registro" size="lg">
                Crear mi cuenta
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/puntos" size="lg" variant="secondary">
                <MapPinned className="size-4" aria-hidden="true" />
                Ver puntos de acopio
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <img
              src="/mascot.webp"
              alt="Tacho verde sonriente de TrackTrash frente al volcán Misti, junto a cartón, una botella y una planta"
              width="900"
              height="900"
              className="relative z-10 mx-auto w-full max-w-md drop-shadow-xl"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <ImpactNumbers />

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Cómo funciona</h2>
          <p className="mt-3 text-muted">Un flujo simple, con estados claros para quien pide y para quien recoge.</p>
        </div>
        <RouteDiagram className="mx-auto mt-10 hidden w-full max-w-xl md:block" />
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-leaf-100 text-leaf-600">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-bold text-muted">Paso {index + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="materiales" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Qué materiales recogemos</h2>
            <p className="mt-3 text-muted">
              El catálogo lo mantiene el equipo de TrackTrash e incluye instrucciones para separar bien cada material.
            </p>
          </div>
          <Materials />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Hecho para cada rol</h2>
          <p className="mt-3 text-muted">Cada persona ve solo lo que necesita para cumplir su parte del recojo.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {audiences.map((audience) => (
            <article key={audience.title} className="flex flex-col rounded-2xl bg-pine-900 p-6 text-white">
              <h3 className="font-display text-2xl font-semibold text-white">{audience.title}</h3>
              <p className="mt-2 flex-1 text-sm text-white/75">{audience.text}</p>
              <Link to={audience.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200">
                {audience.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-lime-300 p-8 sm:flex-row sm:items-center sm:p-12">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold text-pine-950">Empieza con tu primer recojo</h2>
            <p className="mt-2 flex items-start gap-2 text-pine-900/80">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              Recolectores con documentación verificada y seguimiento de cada estado.
            </p>
          </div>
          <ButtonLink to="/registro" size="lg">
            Crear cuenta gratis
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
