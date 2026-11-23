import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '@/api/enums'
import { useAuth } from '@/features/auth/auth'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ListSkeleton } from '@/components/ui/feedback'
import { LandingPage } from '@/pages/public/LandingPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

const CollectionPointsPage = lazy(() => import('@/pages/public/CollectionPointsPage'))
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage'))
const RequestsPage = lazy(() => import('@/pages/app/RequestsPage'))
const NewRequestPage = lazy(() => import('@/pages/app/NewRequestPage'))
const RequestDetailPage = lazy(() => import('@/pages/app/RequestDetailPage'))
const AvailablePage = lazy(() => import('@/pages/app/AvailablePage'))
const ServicesPage = lazy(() => import('@/pages/app/ServicesPage'))
const GatherersPage = lazy(() => import('@/pages/app/GatherersPage'))
const UsersPage = lazy(() => import('@/pages/app/UsersPage'))
const CatalogPage = lazy(() => import('@/pages/app/CatalogPage'))
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ListSkeleton />}>{children}</Suspense>
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center"><ListSkeleton rows={2} /></div>
  if (!user) return <Navigate to="/ingresar" replace />
  return <AppShell />
}

function RequireRole({ roles }: { roles: readonly UserRole[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.roleId)) return <Navigate to="/app" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'puntos', element: <Lazy><CollectionPointsPage /></Lazy> },
      { path: 'ingresar', element: <LoginPage /> },
      { path: 'registro', element: <RegisterPage /> },
    ],
  },
  {
    path: 'app',
    element: <RequireAuth />,
    children: [
      { index: true, element: <Lazy><DashboardPage /></Lazy> },
      { path: 'perfil', element: <Lazy><ProfilePage /></Lazy> },
      { path: 'solicitudes/:id', element: <Lazy><RequestDetailPage /></Lazy> },
      {
        element: <RequireRole roles={['Generator', 'Organization', 'Admin']} />,
        children: [{ path: 'solicitudes', element: <Lazy><RequestsPage /></Lazy> }],
      },
      {
        element: <RequireRole roles={['Generator', 'Organization']} />,
        children: [{ path: 'solicitudes/nueva', element: <Lazy><NewRequestPage /></Lazy> }],
      },
      {
        element: <RequireRole roles={['Gatherer']} />,
        children: [
          { path: 'disponibles', element: <Lazy><AvailablePage /></Lazy> },
          { path: 'servicios', element: <Lazy><ServicesPage /></Lazy> },
        ],
      },
      {
        element: <RequireRole roles={['Admin']} />,
        children: [
          { path: 'recolectores', element: <Lazy><GatherersPage /></Lazy> },
          { path: 'usuarios', element: <Lazy><UsersPage /></Lazy> },
          { path: 'catalogo', element: <Lazy><CatalogPage /></Lazy> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
