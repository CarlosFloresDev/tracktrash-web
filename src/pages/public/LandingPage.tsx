import { useAuth } from '@/features/auth/auth'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, MapPinned, Scale, ShieldCheck, Truck } from 'lucide-react'
import { useGeneralIndicators, useResidueTypes } from '@/api/hooks'
import { labels } from '@/api/enums'
import { formatNumber } from '@/lib/format'
import { MaterialIcon, materialKind } from '@/components/brand/MaterialIcon'
import { materialImage } from '@/components/brand/materialImage'
import { RouteDiagram, SkylineScene } from '@/components/brand/Illustrations'
import { ButtonLink } from '@/components/ui/primitives'
import { Skeleton } from '@/components/ui/primitives'
import { CountUp, Reveal } from '@/components/ui/motion'

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
  const { user } = useAuth()
  const allowed = user?.roleId === 'Admin'
  const query = useGeneralIndicators(allowed)
  if (!allowed || query.isError) return null
  const items = query.data
    ? [
        { label: 'kg recuperados', value: query.data.recoveredKilograms },
        { label: 'recojos completados', value: query.data.completedServices },
        { label: 'recolectores verificados', value: query.data.verifiedGatherers },
        { label: 'organizaciones', value: query.data.totalOrganizations },
      ]
    : null
  return (
    <section aria-label="Impacto de TrackTrash" className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-card md:grid-cols-4">
        {(items ?? Array.from({ length: 4 }, () => null)).map((item, index) => (
          <div key={item?.label ?? index} className="bg-white px-5 py-6 text-center transition-colors hover:bg-leaf-50">
            {item ? (
              <>
                <dd className="font-display text-3xl font-bold tabular-nums text-pine-900 sm:text-4xl">
                  <CountUp value={item.value} format={formatNumber} />
                </dd>
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

const publicMaterials = [
  { name: 'Papel', text: 'Hojas, cuadernos y periódicos limpios y secos.' },
  { name: 'Cartón', text: 'Cajas aplanadas, sin restos de comida ni cinta.' },
  { name: 'Plástico PET', text: 'Botellas de agua y gaseosa, enjuagadas y aplastadas.' },
  { name: 'Plástico HDPE', text: 'Envases de limpieza y lácteos, vacíos y enjuagados.' },
  { name: 'Vidrio', text: 'Botellas y frascos, separados por color.' },
  { name: 'Aluminio', text: 'Latas de bebidas limpias y aplastadas.' },
  { name: 'Metal ferroso', text: 'Latas de conserva y piezas metálicas sin filo.' },
  { name: 'Orgánicos', text: 'Restos de cocina y jardín para compostaje.' },
]

function MaterialCard({ name, text, category }: { name: string; text?: string | null; category?: string }) {
  const photo = materialImage(name)
  return (
    <li className="overflow-hidden rounded-2xl border border-line bg-white">
      {photo ? (
        <img src={photo} alt={name} width="800" height="500" loading="lazy" className="aspect-[8/5] w-full object-cover" />
      ) : (
        <div className="grid aspect-[8/5] place-items-center bg-leaf-50">
          <MaterialIcon kind={materialKind(name)} />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold">{name}</h3>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
        {category && <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-leaf-600">{category}</p>}
      </div>
    </li>
  )
}

function PublicMaterials() {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {publicMaterials.map((item) => (
        <MaterialCard key={item.name} name={item.name} text={item.text} />
      ))}
    </ul>
  )
}

function Materials() {
  const { user } = useAuth()
  const query = useResidueTypes(Boolean(user))
  const recyclable = query.data?.filter((item) => item.isActive).slice(0, 8) ?? []
  if (!user || query.isError) return <PublicMaterials />
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {query.isPending
        ? Array.from({ length: 4 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-36" />
            </li>
          ))
        : recyclable.map((item) => (
            <MaterialCard
              key={item.residueTypeId}
              name={item.name}
              text={item.classificationInstructions ?? item.description}
              category={labels.category[item.residueCategoryId]}
            />
          ))}
    </ul>
  )
}

export function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-paper">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-24 -z-10 size-[28rem] rounded-full bg-lime-300/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 -z-10 size-[24rem] rounded-full bg-leaf-400/25 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[26rem] opacity-90 sm:h-[30rem]">
          <SkylineScene className="size-full" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-28 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-36 md:pt-20">
          <div className="animate-fade-up">
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
              Tus residuos reciclables, <span className="text-leaf-600">recogidos y medidos</span> en Arequipa.
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
          <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:120ms] md:max-w-none">
            <div aria-hidden="true" className="absolute inset-[12%] rounded-full bg-lime-300/50 blur-3xl" />
            <div className="absolute left-0 top-[18%] z-20 hidden rounded-2xl border border-line bg-white px-4 py-3 shadow-card sm:block">
              <p className="text-xs font-medium text-muted">Recojo en camino</p>
              <p className="font-display text-sm font-bold text-pine-900">Yanahuara, 09:00</p>
            </div>
            <div className="absolute bottom-[14%] right-0 z-20 hidden rounded-2xl bg-pine-900 px-4 py-3 text-white shadow-card sm:block">
              <p className="text-xs text-white/70">Material recuperado</p>
              <p className="font-display text-sm font-bold text-lime-300">+18 kg de cartón</p>
            </div>
            <img
              src="/mascot.webp"
              alt="Tacho verde sonriente de TrackTrash frente al volcán Misti, junto a cartón, una botella y una planta"
              width="900"
              height="900"
              className="relative z-10 mx-auto w-full max-w-md drop-shadow-2xl"
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
            <Reveal as="li" key={step.title} delay={index * 80} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-leaf-100 text-leaf-600">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-sm font-bold text-muted">Paso {index + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </Reveal>
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
          {audiences.map((audience, index) => (
            <Reveal as="article" key={audience.title} delay={index * 80} className="group relative flex flex-col overflow-hidden rounded-2xl bg-pine-900 p-6 text-white">
              <div aria-hidden="true" className="absolute -right-10 -top-10 size-32 rounded-full bg-lime-300/10" />
              <h3 className="font-display text-2xl font-semibold text-white">{audience.title}</h3>
              <p className="mt-2 flex-1 text-sm text-white/75">{audience.text}</p>
              <Link to={audience.to} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-lime-300 hover:text-lime-200">
                {audience.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-pine-950 py-20 text-white">
        <div aria-hidden="true" className="absolute -left-20 top-0 size-96 rounded-full bg-leaf-600/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Tu recojo en el bolsillo</h2>
            <p className="mt-4 max-w-md text-white/70">
              La app para Android acompaña al hogar y al recolector en la calle: crear solicitudes, postular a recojos,
              registrar los kilos y ver los puntos de acopio en el mapa.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              {['Estados de cada recojo', 'Mapa de puntos de acopio', 'Registro de material recuperado'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-lime-300" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="relative flex justify-center gap-5">
            {[
              { src: '/app-home.webp', alt: 'Pantalla de inicio de la app con recojos activos', className: 'mt-10 -rotate-3' },
              { src: '/app-points.webp', alt: 'Pantalla de puntos de acopio con mapa de Arequipa', className: 'rotate-3' },
            ].map((phone, index) => (
              <Reveal key={phone.src} delay={index * 80} className={phone.className}>
                <div className="w-44 rounded-[2rem] border-4 border-white/15 bg-black p-1.5 shadow-2xl sm:w-52">
                  <img src={phone.src} alt={phone.alt} width="390" height="844" loading="lazy" className="w-full rounded-[1.5rem]" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
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
