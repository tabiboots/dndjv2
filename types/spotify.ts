export class SpotifyError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: 'unauthenticated' | 'forbidden' | 'rate_limited' | 'spotify_error' | 'network_error',
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'SpotifyError'
  }
}
