import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gatherersApi, organizationsApi } from '@/api/endpoints'
import type { Gatherer, Organization, User } from '@/api/schemas'
import { ApiError, refreshSession } from '@/lib/http'
import { authGateway } from './gateway'

import { clearSession, getSession, onSessionEnd } from './session'

interface AuthState {
  user: User | null
  gatherer: Gatherer | null
  organization: Organization | null
  /** True while the stored session is being restored on first load. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => void
  /** Re-reads the user (and role profiles) after a profile change. */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

async function optional<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUserState] = useState<User | null>(null)
  const [restoring, setRestoring] = useState(() => getSession() !== null)

  useEffect(() => {
    if (!getSession()) return
    let cancelled = false
    authGateway
      .restore()
      .then((restored) => !cancelled && setUserState(restored))
      .catch(() => { if (!cancelled) clearSession() })
      .finally(() => !cancelled && setRestoring(false))
    return () => {
      cancelled = true
    }
  }, [])

  const profile = useQuery({
    queryKey: ['auth', 'profile', user?.userId, user?.roleId],
    enabled: user !== null,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return { gatherer: null, organization: null }
      if (user.roleId === 'Gatherer') return { gatherer: await optional(() => gatherersApi.byUser(user.userId)), organization: null }
      if (user.roleId === 'Organization') {
        return { gatherer: null, organization: await optional(() => organizationsApi.byUser(user.userId)) }
      }
      return { gatherer: null, organization: null }
    },
  })

  const signIn = useCallback(async (email: string, password: string) => {
    const signedIn = await authGateway.signIn(email, password)
    queryClient.clear()
    setUserState(signedIn)
    return signedIn
  }, [queryClient])

  useEffect(() => onSessionEnd(() => {
    setUserState(null)
    queryClient.clear()
  }), [queryClient])

  const signOut = useCallback(() => { void authGateway.signOut() }, [])

  useEffect(() => {
    if (!user) return
    const renewOnInteraction = () => {
      const session = getSession()
      if (session && Date.now() >= session.refreshAt) void refreshSession().catch(() => undefined)
    }
    window.addEventListener('pointerdown', renewOnInteraction)
    window.addEventListener('keydown', renewOnInteraction)
    return () => {
      window.removeEventListener('pointerdown', renewOnInteraction)
      window.removeEventListener('keydown', renewOnInteraction)
    }
  }, [user])

  const value = useMemo<AuthState>(
    () => ({
      user,
      gatherer: profile.data?.gatherer ?? null,
      organization: profile.data?.organization ?? null,
      loading: restoring || (user !== null && profile.isPending),
      signIn,
      signOut,
      setUser: setUserState,
    }),
    [user, profile.data, profile.isPending, restoring, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export function useRequiredUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('A signed-in user is required here')
  return user
}
