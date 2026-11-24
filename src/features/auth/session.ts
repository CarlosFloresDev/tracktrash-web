import { z } from 'zod'

export const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
  expiresIn: z.number().positive(),
  refreshAfterSeconds: z.number().positive(),
})
const storedSchema = tokensSchema.extend({ refreshAt: z.number() })
type Session = z.infer<typeof storedSchema>
const key = 'tracktrash.tokens'
const listeners = new Set<() => void>()

function load(): Session | null {
  try {
    return storedSchema.safeParse(JSON.parse(sessionStorage.getItem(key) ?? 'null')).data ?? null
  } catch {
    return null
  }
}

let current = load()
let epoch = 0
export const getSession = () => current
export const getSessionEpoch = () => epoch

export function saveSession(tokens: z.infer<typeof tokensSchema>, rotating = false) {
  if (!rotating) epoch++
  current = { ...tokens, refreshAt: Date.now() + tokens.refreshAfterSeconds * 1000 }
  try { sessionStorage.setItem(key, JSON.stringify(current)) } catch { /* Memory remains available. */ }
}

export function clearSession() {
  epoch++
  current = null
  try { sessionStorage.removeItem(key) } catch { /* Storage may be disabled. */ }
  listeners.forEach((listener) => listener())
}

export function onSessionEnd(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
