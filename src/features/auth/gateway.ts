import { usersApi } from '@/api/endpoints'
import { ApiError } from '@/lib/http'
import type { User } from '@/api/schemas'

/**
 * The backend does not expose authentication yet: there is no login endpoint and no token validation.
 * Everything that talks about "signing in" goes through this gateway, so adopting a real
 * `POST /api/Auth/login` later only means providing another implementation.
 */
export interface AuthGateway {
  readonly verifiesPassword: boolean
  signIn(email: string, password: string): Promise<User>
  restore(userId: number): Promise<User>
}

/** Provisional: resolves the account by e-mail. The password is NOT verified by the backend. */
export const provisionalGateway: AuthGateway = {
  verifiesPassword: false,
  async signIn(email) {
    try {
      const user = await usersApi.byEmail(email.trim().toLowerCase())
      if (!user.isActive) throw new ApiError('Esta cuenta esta desactivada.', 403)
      return user
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError('No encontramos una cuenta con ese correo.', 404)
      }
      throw error
    }
  },
  async restore(userId) {
    const user = await usersApi.byId(userId)
    if (!user.isActive) throw new ApiError('Esta cuenta esta desactivada.', 403)
    return user
  },
}

export const authGateway: AuthGateway = provisionalGateway
