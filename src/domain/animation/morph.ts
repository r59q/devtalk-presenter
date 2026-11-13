import { smoothstep } from '../geometry/numbers.ts'
import { blend, pairClouds, type ParticlePair } from '../morph/point-cloud.ts'
import type { Element } from '../scene/element.ts'
import { ParticlesElement } from '../scene/particles.ts'
import type { Scene } from '../scene/scene.ts'
import type { Animation } from './animation.ts'
import { ease as easings, type Easing } from './easing.ts'

export interface MorphOptions {
  readonly duration?: number
  /** 0 moves every particle at once, 1 sweeps through them from left to right. */
  readonly sweep?: number
  readonly ease?: Easing
}

/** Share of the morph spent cross-fading between the real elements and their particles. */
const handover = 0.12

/**
 * Dissolves `from` into particles that fly into the shape of `to`. Works for any pair of
 * elements: text into text, an image into text, a shape into an image and so on.
 * `to` is hidden until the morph plays and is added to the scene if it is not there yet.
 */
export function morph(from: Element, to: Element, { duration = 1.6, sweep = 0.35, ease = easings.inOut }: MorphOptions = {}): Animation {
  const targetOpacity = to.opacity
  to.opacity = 0
  let sourceOpacity = from.opacity
  let scene: Scene
  let particles: ParticlesElement
  let pairs: ParticlePair[] = []

  return {
    duration,
    start(context) {
      scene = context.scene
      scene.add(to)
      sourceOpacity = from.opacity
      pairs = pairClouds(context.sampler.sample(from, scene.time), context.sampler.sample(to, scene.time))
      particles = scene.add(new ParticlesElement(context.sampler.spacing))
    },
    update(progress) {
      const arriving = smoothstep(1 - handover, 1, progress)
      const leaving = smoothstep(0, handover, progress)
      from.opacity = sourceOpacity * (1 - leaving)
      to.opacity = targetOpacity * arriving
      particles.opacity = leaving * (1 - arriving)
      particles.cloud = blend(pairs, progress, sweep, ease)
      if (progress >= 1) scene.remove(particles)
    },
  }
}
