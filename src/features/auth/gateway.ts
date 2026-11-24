import { usersApi } from '@/api/endpoints'
import { ApiError, request } from '@/lib/http'
import { clearSession, getSession, saveSession, tokensSchema } from './session'

export const authGateway = {
  async signIn(email: string, password: string) {
    let payload: unknown
    try {
      payload = await request('Auth/Login', {
        method: 'POST', body: { email: email.trim().toLowerCase(), password }, anonymous: true,
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError('Correo o contrasena incorrectos, o cuenta desactivada.', 401)
      }
      throw error
    }
    saveSession(tokensSchema.parse(payload))
    try {
      return await usersApi.me()
    } catch (error) {
      await this.signOut()
      throw error
    }
  },
  restore: () => usersApi.me(),
  async signOut() {
    const session = getSession()
    clearSession()
    if (session) {
      await request('Auth/Logout', {
        method: 'POST', body: { refreshToken: session.refreshToken }, anonymous: true,
      }).catch(() => undefined)
    }
  },
}
