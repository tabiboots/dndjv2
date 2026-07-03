export type HslTriplet = { h: number; s: number; l: number }

export function hslToTriplet(color: string | null | undefined): HslTriplet | null {
  const match = color?.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%/)
  if (!match) return null
  return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) }
}

export function tripletToHsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function randomTagColor(): string {
  return tripletToHsl(Math.floor(Math.random() * 360), 65, 55)
}
