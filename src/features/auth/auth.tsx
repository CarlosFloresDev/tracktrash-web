import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gatherersApi, organizationsApi } from '@/api/endpoints'
import type { Gatherer, Organization, User } from '@/api/schemas'
import { ApiError } from '@/lib/http'
import { authGateway } from './gateway'

const STORAGE_KEY = 'tracktrash.session'

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

function readStoredId(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const id = raw ? Number(raw) : NaN
    return Number.isInteger(id) ? id : null
  } catch {
    return null
  }
}

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
  const [restoring, setRestoring] = useState(() => readStoredId() !== null)

  useEffect(() => {
    const storedId = readStoredId()
    if (storedId === null) return
    let cancelled = false
    authGateway
      .restore(storedId)
      .then((restored) => !cancelled && setUserState(restored))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
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
    localStorage.setItem(STORAGE_KEY, String(signedIn.userId))
    setUserState(signedIn)
    return signedIn
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUserState(null)
    queryClient.clear()
  }, [queryClient])

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
