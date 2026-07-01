import { describe, expect, it } from 'vitest'
import { searchSchema } from '../route'

describe('searchSchema', () => {
  it('accepts valid params', () => {
    const result = searchSchema.safeParse({ q: 'radiohead', limit: '5', offset: '0' })
    expect(result.success).toBe(true)
  })

  it('applies defaults for limit and offset', () => {
    const result = searchSchema.safeParse({ q: 'radiohead' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(10)
      expect(result.data.offset).toBe(0)
      expect(result.data.type).toBe('track')
    }
  })

  it('rejects missing q', () => {
    const result = searchSchema.safeParse({ limit: '5' })
    expect(result.success).toBe(false)
  })

  it('rejects empty q', () => {
    const result = searchSchema.safeParse({ q: '' })
    expect(result.success).toBe(false)
  })

  it('rejects limit above 10', () => {
    const result = searchSchema.safeParse({ q: 'test', limit: '50' })
    expect(result.success).toBe(false)
  })

  it('rejects limit below 1', () => {
    const result = searchSchema.safeParse({ q: 'test', limit: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects negative offset', () => {
    const result = searchSchema.safeParse({ q: 'test', offset: '-1' })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers', () => {
    const result = searchSchema.safeParse({ q: 'test', limit: '5', offset: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(5)
      expect(result.data.offset).toBe(10)
    }
  })
})
