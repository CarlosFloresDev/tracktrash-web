import { ExternalLink } from 'lucide-react'
import { imageCredits } from '@/components/brand/materialImage'

export default function CreditsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Créditos de imágenes</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Las fotos de materiales provienen de Wikimedia Commons y se usan según sus licencias libres. Se recortaron y
        comprimieron para la web.
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {imageCredits.map((item) => (
          <li key={item.image} className="overflow-hidden rounded-2xl border border-line bg-white">
            <img src={item.image} alt={item.material} width="800" height="500" loading="lazy" className="aspect-[8/5] w-full object-cover" />
            <div className="space-y-1 p-4 text-sm">
              <p className="font-display text-base font-semibold">{item.material}</p>
              <p className="text-muted">
                Autor: <span className="text-ink">{item.author}</span>
              </p>
              <p className="text-muted">
                Licencia: <span className="text-ink">{item.license}</span>
              </p>
              <a href={item.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-leaf-600 hover:underline">
                Ver original
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
