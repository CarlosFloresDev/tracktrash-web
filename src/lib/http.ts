import { clearSession, getSession, getSessionEpoch, saveSession, tokensSchema } from '@/features/auth/session'
import { env } from './env'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fieldErrors: Record<string, string[]>
  /** True when the server explained the refusal (`{ error }` without `code`): a business rule, not a dead session. */
  readonly business: boolean

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}, code?: string, business = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.business = business
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  anonymous?: boolean
}

const statusMessages: Record<number, string> = {
  401: 'Tu sesion no es valida. Vuelve a ingresar.',
  403: 'No tienes permiso para esta operacion.',
  404: 'No encontramos lo que buscabas.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
}

/** Translates the backend's error shapes (`{ error }` and ASP.NET validation problem details). */
export async function toApiError(response: Response): Promise<ApiError> {
  const payload: unknown = await response.json().catch(() => null)
  if (payload && typeof payload === 'object') {
    const data = payload as { error?: unknown; errors?: Record<string, string[]>; title?: unknown; code?: string }
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat()
      return new ApiError(messages.join(' ') || 'Datos invalidos.', response.status, data.errors)
    }
    if (typeof data.error === 'string' && response.status < 500) {
      return new ApiError(data.error, response.status, {}, data.code, data.code === undefined)
    }
  }
  return new ApiError(statusMessages[response.status] ?? 'No pudimos completar la operacion.', response.status)
}

async function send<T>(path: string, options: RequestOptions, token?: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}/api/${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexion.', 0)
  }
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}


let refreshing: { epoch: number; promise: Promise<void> } | undefined

export function refreshSession(): Promise<void> {
  const session = getSession()
  if (!session) return Promise.resolve()
  const epoch = getSessionEpoch()
  if (refreshing?.epoch === epoch) return refreshing.promise

  const promise = send<unknown>('Auth/Refresh', {
    method: 'POST', body: { refreshToken: session.refreshToken },
  }).then((payload) => {
    const tokens = tokensSchema.parse(payload)
    if (getSessionEpoch() === epoch) saveSession(tokens, true)
  }).catch((error: unknown) => {
    if (getSessionEpoch() === epoch && error instanceof ApiError && error.status === 401) clearSession()
    throw error
  }).finally(() => {
    if (refreshing?.epoch === epoch) refreshing = undefined
  })
  refreshing = { epoch, promise }
  return promise
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const initial = options.anonymous ? null : getSession()
  if (!initial) return send<T>(path, options)
  const epoch = getSessionEpoch()
  const requireSession = () => {
    const session = getSession()
    if (!session || getSessionEpoch() !== epoch) throw new ApiError(statusMessages[401], 401)
    return session
  }

  if (Date.parse(initial.expiresAt) <= Date.now()) await refreshSession()
  const sent = requireSession()
  try {
    return await send<T>(path, options, sent.accessToken)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || error.business) throw error
    const latest = requireSession()
    if (latest !== sent || error.code === 'ACCESS_TOKEN_EXPIRED') {
      if (latest === sent) await refreshSession()
      try {
        return await send<T>(path, options, requireSession().accessToken)
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && !retryError.business && getSessionEpoch() === epoch) clearSession()
        throw retryError
      }
    }
    clearSession()
    throw error
  }
}
