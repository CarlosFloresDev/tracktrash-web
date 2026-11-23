import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PlusCircle,
  Recycle,
  ShieldCheck,
  Tags,
  Truck,

  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { labels, type UserRole } from '@/api/enums'
import { useAuth } from '@/features/auth/auth'
import { fullName, initials } from '@/lib/format'
import { Logo } from '@/components/brand/Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navigation: Record<UserRole, NavItem[]> = {
  Generator: [
    { to: '/app', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/app/solicitudes', label: 'Mis solicitudes', icon: ClipboardList, end: true },
    { to: '/app/solicitudes/nueva', label: 'Nueva solicitud', icon: PlusCircle },
  ],
  Organization: [
    { to: '/app', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/app/solicitudes', label: 'Solicitudes', icon: ClipboardList, end: true },
    { to: '/app/solicitudes/nueva', label: 'Nueva solicitud', icon: PlusCircle },
  ],
  Gatherer: [
    { to: '/app', label: 'Resumen', icon: LayoutDashboard, end: true },
    { to: '/app/disponibles', label: 'Recojos disponibles', icon: PackageSearch },
    { to: '/app/servicios', label: 'Mis servicios', icon: Truck },
  ],
  Admin: [
    { to: '/app', label: 'Indicadores', icon: BarChart3, end: true },
    { to: '/app/solicitudes', label: 'Solicitudes', icon: ClipboardList, end: true },
    { to: '/app/recolectores', label: 'Recolectores', icon: ShieldCheck },
    { to: '/app/usuarios', label: 'Usuarios', icon: Users },
    { to: '/app/catalogo', label: 'Catálogo', icon: Tags },
  ],
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  if (!user) return null
  const items = navigation[user.roleId]

  const sidebar = (
    <nav aria-label="Principal" className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Link to="/" aria-label="TrackTrash, inicio público">
          <Logo inverted />
        </Link>
      </div>
      <ul className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-lime-300 text-pine-950' : 'text-white/80 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink
            to="/puntos"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Recycle className="size-[18px]" aria-hidden="true" />
            Puntos de acopio
          </NavLink>
        </li>
      </ul>
      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/app/perfil"
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            clsx('flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/10', isActive && 'bg-white/10')
          }
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime-300 text-sm font-bold text-pine-950">
            {initials(user)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{fullName(user)}</span>
            <span className="block truncate text-xs text-white/60">{labels.role[user.roleId]}</span>
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => {
            signOut()
            navigate('/')
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-pine-900 lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
        <Link to="/app" aria-label="TrackTrash, panel">
          <Logo />
        </Link>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-full hover:bg-leaf-50"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-pine-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-pine-900 shadow-2xl">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main id="contenido" className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div key={pathname} className="mx-auto max-w-6xl animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

