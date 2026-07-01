import { describe, expect, it } from 'vitest'
import { SpotifyError } from '../spotify'

describe('SpotifyError', () => {
  it('sets all fields correctly', () => {
    const err = new SpotifyError('Token expired', 401, 'unauthenticated')
    expect(err.message).toBe('Token expired')
    expect(err.status).toBe(401)
    expect(err.code).toBe('unauthenticated')
    expect(err.name).toBe('SpotifyError')
    expect(err).toBeInstanceOf(Error)
  })

  it('sets retryAfter when provided', () => {
    const err = new SpotifyError('Rate limited', 429, 'rate_limited', 30)
    expect(err.retryAfter).toBe(30)
  })

  it('retryAfter is undefined when not provided', () => {
    const err = new SpotifyError('Forbidden', 403, 'forbidden')
    expect(err.retryAfter).toBeUndefined()
  })

  it('is catchable as instanceof SpotifyError', () => {
    const caught = (() => {
      try {
        throw new SpotifyError('test', 500, 'spotify_error')
      } catch (err) {
        return err instanceof SpotifyError
      }
    })()
    expect(caught).toBe(true)
  })
})
