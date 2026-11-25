import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/features/auth/auth'
import { Logo } from '@/components/brand/Logo'
import { ButtonLink } from '@/components/ui/primitives'

const links = [
  { to: '/#como-funciona', label: 'Cómo funciona' },
  { to: '/#materiales', label: 'Materiales' },
  { to: '/puntos', label: 'Puntos de acopio' },
]

export function PublicLayout() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const immersive = pathname === '/ingresar' || pathname === '/registro'

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-pine-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="TrackTrash, inicio" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-full px-4 py-2 text-sm font-medium text-pine-900 hover:bg-leaf-50',
                    isActive && !link.to.includes('#') && 'bg-leaf-100',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <ButtonLink to="/app" size="sm">
                Ir a mi panel
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/ingresar" variant="ghost" size="sm">
                  Ingresar
                </ButtonLink>
                <ButtonLink to="/registro" size="sm">
                  Crear cuenta
                </ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-leaf-50 md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div id="menu-movil" className="border-t border-line bg-paper px-4 pb-4 md:hidden">
            <nav aria-label="Principal móvil" className="flex flex-col py-2">
              {links.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex gap-2">
              {user ? (
                <ButtonLink to="/app" className="flex-1" onClick={() => setOpen(false)}>
                  Ir a mi panel
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/ingresar" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    Ingresar
                  </ButtonLink>
                  <ButtonLink to="/registro" className="flex-1" onClick={() => setOpen(false)}>
                    Crear cuenta
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      {!immersive && (
        <footer className="bg-pine-950 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Logo inverted />
              <p className="mt-4 max-w-sm text-sm text-white/70">
                Coordinamos recojos de residuos reciclables entre hogares, organizaciones y recolectores verificados en
                Arequipa.
              </p>
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-lime-300">Plataforma</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li><Link to="/puntos" className="hover:text-white">Puntos de acopio</Link></li>
                <li><Link to="/registro" className="hover:text-white">Crear cuenta</Link></li>
                <li><Link to="/ingresar" className="hover:text-white">Ingresar</Link></li>
                <li><Link to="/creditos" className="hover:text-white">Créditos de imágenes</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-lime-300">Proyecto</h2>
              <p className="mt-3 text-sm text-white/70">
                Proyecto académico de Tecsup Arequipa. Desarrollado en equipo con backend .NET, app móvil Flutter y web
                React.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
            TrackTrash {new Date().getFullYear()}. Arequipa, Perú.
          </div>
        </footer>
      )}
    </div>
  )
}
