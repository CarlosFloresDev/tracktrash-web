import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request, toApiError } from './http'

afterEach(() => vi.restoreAllMocks())

describe('toApiError', () => {
  it('reads the backend { error } shape', async () => {
    const error = await toApiError(new Response(JSON.stringify({ error: 'Email is already registered.' }), { status: 400 }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Email is already registered.')
    expect(error.status).toBe(400)
  })

  it('flattens ASP.NET validation errors and keeps field errors', async () => {
    const body = { errors: { Email: ['The Email field is not a valid e-mail address.'], Password: ['Too short.'] } }
    const error = await toApiError(new Response(JSON.stringify(body), { status: 400 }))
    expect(error.message).toContain('Too short.')
    expect(error.fieldErrors.Email).toHaveLength(1)
  })

  it('hides server error details on 5xx', async () => {
    const error = await toApiError(new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), { status: 500 }))
    expect(error.message).toMatch(/servidor/)
  })
})

describe('request', () => {
  it('returns parsed JSON and sends a JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await request<{ ok: boolean }>('User', { method: 'POST', body: { a: 1 } })
    expect(result.ok).toBe(true)
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.body).toBe('{"a":1}')
  })

  it('maps network failures to a friendly ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
    await expect(request('User')).rejects.toMatchObject({ status: 0 })
  })
})
