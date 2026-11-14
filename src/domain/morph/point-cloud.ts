import { mixColors, withAlpha, type Color } from '../geometry/color.ts'
import { clamp01, lerp } from '../geometry/numbers.ts'
import type { Easing } from '../animation/easing.ts'

export interface Particle {
  readonly x: number
  readonly y: number
  readonly color: Color
}

/** A shape described as colored points in stage coordinates. */
export type PointCloud = readonly Particle[]

export interface ParticlePair {
  readonly from: Particle
  readonly to: Particle
  /** Position of the pair in the left-to-right sweep, 0–1. */
  readonly order: number
}

/**
 * Matches every point of one cloud with a point of the other. Both clouds are read left to
 * right, so neighbouring points travel to neighbouring points and shapes flow into each other.
 * An empty cloud fades in or out in place of the other one.
 */
export function pairClouds(from: PointCloud, to: PointCloud): ParticlePair[] {
  if (from.length === 0 && to.length === 0) return []
  const source = leftToRight(from.length > 0 ? from : invisible(to))
  const target = leftToRight(to.length > 0 ? to : invisible(from))
  const count = Math.max(source.length, target.length)
  return Array.from({ length: count }, (_, index) => ({
    from: source[Math.floor((index * source.length) / count)],
    to: target[Math.floor((index * target.length) / count)],
    order: index / count,
  }))
}

/**
 * The cloud part way through a morph. With a `sweep` above zero the left-most particles set
 * off first and the right-most ones last, which reads as a wave.
 */
export function blend(pairs: readonly ParticlePair[], t: number, sweep: number, ease: Easing): PointCloud {
  const spread = clamp01(sweep) * 0.99
  return pairs.map(({ from, to, order }) => {
    const local = ease(clamp01((t - order * spread) / (1 - spread)))
    return {
      x: lerp(from.x, to.x, local),
      y: lerp(from.y, to.y, local),
      color: mixColors(from.color, to.color, local),
    }
  })
}

function leftToRight(cloud: PointCloud): Particle[] {
  return [...cloud].sort((a, b) => a.x - b.x || a.y - b.y)
}

function invisible(cloud: PointCloud): PointCloud {
  return cloud.map((particle) => ({ ...particle, color: withAlpha(particle.color, 0) }))
}
