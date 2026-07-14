import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: { playlist_id: 'pl1' } }) }),
      }),
    }),
  }),
}))

const spotifyFetch = vi.fn(async (_path: string, _init?: { method: string; body: string }) => ({
  json: async () => ({ id: 'pl1' }),
}))
vi.mock('@/lib/spotify/fetch', () => ({
  spotifyFetch: (path: string, init?: { method: string; body: string }) => spotifyFetch(path, init),
}))

import { POST } from '../route'

const uris = (n: number) => Array.from({ length: n }, (_, i) => `spotify:track:${i}`)
const request = (body: unknown) => ({ json: async () => body }) as NextRequest
const itemCalls = () =>
  spotifyFetch.mock.calls
    .filter(([path]) => path.endsWith('/items'))
    .map(([, init]) => ({
      method: init!.method,
      count: (JSON.parse(init!.body).uris as string[]).length,
    }))

beforeEach(() => spotifyFetch.mockClear())

describe('deploy batching', () => {
  it('sends 50 tracks as a single PUT', async () => {
    const res = await POST(request({ uris: uris(50), play: false }))
    expect((await res.json()).total).toBe(50)
    expect(itemCalls()).toEqual([{ method: 'PUT', count: 50 }])
  })

  it('splits 250 tracks into PUT 100 + POST 100 + POST 50, in order', async () => {
    const res = await POST(request({ uris: uris(250), play: false }))
    expect((await res.json()).total).toBe(250)
    expect(itemCalls()).toEqual([
      { method: 'PUT', count: 100 },
      { method: 'POST', count: 100 },
      { method: 'POST', count: 50 },
    ])
  })

  it('never exceeds the 100-item limit per request', async () => {
    await POST(request({ uris: uris(1234), play: false }))
    for (const call of itemCalls()) expect(call.count).toBeLessThanOrEqual(100)
  })
})
