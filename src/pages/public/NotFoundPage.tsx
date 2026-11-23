import { EmptyBoxIllustration } from '@/components/brand/Illustrations'
import { ButtonLink } from '@/components/ui/primitives'

export function NotFoundPage() {
  return (
    <main id="contenido" className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <EmptyBoxIllustration className="mx-auto w-48" />
        <h1 className="mt-6 font-display text-3xl font-bold">No encontramos esta página</h1>
        <p className="mt-2 text-muted">Puede que el enlace haya cambiado o que nunca haya existido.</p>
        <ButtonLink to="/" className="mt-6">
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  )
}
