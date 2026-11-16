import { withAlpha, type Color } from '../geometry/color.ts'
import { clamp, lerp, smoothstep } from '../geometry/numbers.ts'
import { blend, pairClouds, type ParticlePair } from '../morph/point-cloud.ts'
import type { Sampler } from '../morph/sampler.ts'
import { blendSilhouettes, inReadingOrder, pairSilhouettes, placeSilhouette, type PiecePair, type Silhouette } from '../morph/silhouette.ts'
import type { Element } from '../scene/element.ts'
import { FiguresElement } from '../scene/figures.ts'
import { ParticlesElement } from '../scene/particles.ts'
import type { Scene } from '../scene/scene.ts'
import { TextElement } from '../scene/text.ts'
import type { Animation } from './animation.ts'
import { ease as easings, type Easing } from './easing.ts'

/**
 * How a morph looks while it plays. `vector` deforms the letters of one text into the
 * letters of the other as smooth filled shapes; it only works between texts. `particles`
 * dissolves any element into dots that fly into the shape of the other one.
 */
export type MorphStyle = 'vector' | 'particles'

export interface MorphOptions {
  readonly duration?: number
  /** 0 moves everything at once, 1 sweeps through the shapes or particles from left to right. */
  readonly sweep?: number
  readonly ease?: Easing
  /** Text into text morphs as `vector` unless this says `particles`. Other elements always use particles. */
  readonly style?: MorphStyle
}

/**
 * Turns `from` into `to`. Text morphs into text as smooth shapes, and any other pair of
 * elements, such as an image into text, morphs through particles. `to` is hidden until the
 * morph plays and is added to the scene if it is not there yet.
 */
export function morph(from: TextElement, to: TextElement, options?: MorphOptions): Animation
export function morph(from: Element, to: Element, options?: MorphOptions & { readonly style?: 'particles' }): Animation
export function morph(from: Element, to: Element, { style = 'vector', ...options }: MorphOptions = {}): Animation {
  // Elements other than text cannot be traced, so asking them for a vector morph falls back to particles.
  if (style === 'vector' && from instanceof TextElement && to instanceof TextElement) return vectorMorph(from, to, options)
  return particleMorph(from, to, options)
}

/** Share of the particle morph spent cross-fading between the real elements and their particles. */
const handover = 0.12

function particleMorph(from: Element, to: Element, { duration = 1.6, sweep = 0.35, ease = easings.inOut }: MorphOptions): Animation {
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

/**
 * Traces both texts into filled shapes and deforms one set into the other. The shapes match
 * the real texts at both ends, so the texts swap with them without a cross-fade.
 */
function vectorMorph(from: TextElement, to: TextElement, { duration = 1.6, sweep = 0.35, ease = easings.inOut }: MorphOptions): Animation {
  const targetOpacity = to.opacity
  to.opacity = 0
  let sourceOpacity = from.opacity
  let scene: Scene
  let figures: FiguresElement
  let shapes: () => Shapes

  return {
    duration,
    start(context) {
      scene = context.scene
      scene.add(to)
      sourceOpacity = from.opacity
      // The texts are captured as they look now, but only traced when a frame between the ends
      // needs them: jumping past the morph never does.
      const [source, target] = [silhouetteOf(from, context.sampler), silhouetteOf(to, context.sampler)]
      const looks = { from: { color: from.color, opacity: sourceOpacity }, to: { color: to.color, opacity: targetOpacity } }
      shapes = once(() => shapesBetween(source(), target(), looks))
      figures = scene.add(new FiguresElement())
    },
    update(progress) {
      const between = progress > 0 && progress < 1
      from.opacity = progress <= 0 ? sourceOpacity : 0
      to.opacity = progress >= 1 ? targetOpacity : 0
      if (between) {
        const { pairs, colors, fade } = shapes()
        figures.opacity = lerp(fade.from, fade.to, ease(progress))
        figures.figures = blendSilhouettes(pairs, progress, sweep, ease, colors)
      } else {
        figures.opacity = 0
        figures.figures = []
      }
      if (progress >= 1) scene.remove(figures)
    },
  }
}

interface Look {
  readonly color: Color
  readonly opacity: number
}

function shapesBetween(source: Silhouette, target: Silhouette, looks: { from: Look; to: Look }): Shapes {
  const { from, to } = looks
  // An empty side takes the colour of the other one, so the shapes only fade.
  const [first, last] = [source.length > 0 ? from.color : to.color, target.length > 0 ? to.color : from.color]
  return {
    pairs: pairSilhouettes(source, target),
    colors: { from: withAlpha(first, 1), to: withAlpha(last, 1) },
    fade: { from: source.length > 0 ? from.opacity * from.color.a : 0, to: target.length > 0 ? to.opacity * to.color.a : 0 },
  }
}

interface Shapes {
  readonly pairs: PiecePair[]
  readonly colors: { readonly from: Color; readonly to: Color }
  readonly fade: { readonly from: number; readonly to: number }
}

/** Captures the text as it looks on the stage right now, to be traced when asked for. */
function silhouetteOf(text: TextElement, sampler: Sampler): () => Silhouette {
  const lines = text.visibleLines
  const { font, size, weight, align, lineHeight, color } = text
  const style = { font, size, weight, align, lineHeight, color }
  const placement = { x: text.x, y: text.y, scale: text.scale, rotation: text.rotation }
  // Two traced pixels per stage pixel keep the shapes smooth on high-density screens too.
  const detail = clamp(Math.ceil(Math.abs(text.scale) * 4) / 2, 1, 8)
  return () => placeSilhouette(inReadingOrder(sampler.trace(lines, style, detail), lines.length, size * lineHeight), placement)
}

function once<T>(compute: () => T): () => T {
  let result: { value: T } | undefined
  return () => (result ??= { value: compute() }).value
}
