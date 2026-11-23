import { env } from './env'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

const statusMessages: Record<number, string> = {
  401: 'Tu sesion no es valida. Vuelve a ingresar.',
  403: 'No tienes permiso para esta operacion.',
  404: 'No encontramos lo que buscabas.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
}

/** Translates the backend's error shapes (`{ error }` and ASP.NET validation problem details). */
export async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (payload && typeof payload === 'object') {
    const data = payload as { error?: unknown; errors?: Record<string, string[]>; title?: unknown }
    if (data.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat()
      return new ApiError(messages.join(' ') || 'Datos invalidos.', response.status, data.errors)
    }
    if (typeof data.error === 'string' && response.status < 500) {
      return new ApiError(data.error, response.status)
    }
  }
  return new ApiError(statusMessages[response.status] ?? 'No pudimos completar la operacion.', response.status)
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}/api/${path}`, {
      method: options.method ?? 'GET',
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
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
