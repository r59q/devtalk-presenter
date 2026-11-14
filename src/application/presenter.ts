import type { Animation, AnimationContext } from '../domain/animation/animation.ts'
import { clamp01 } from '../domain/geometry/numbers.ts'
import type { Sampler } from '../domain/morph/sampler.ts'
import type { Outline, Position } from '../domain/presentation/outline.ts'
import type { Presentation } from '../domain/presentation/presentation.ts'
import type { BuiltSlide } from '../domain/presentation/slide.ts'
import type { Responses } from '../domain/scene/field.ts'
import type { Surface } from '../domain/scene/surface.ts'

interface Playback {
  readonly animation: Animation
  elapsed: number
}

export interface PresenterOptions {
  readonly presentation: Presentation
  readonly outline: Outline
  readonly sampler: Sampler
  /** Called whenever the position changes, e.g. to keep it in the URL. */
  readonly onMove?: (position: Position) => void
}

/** Runs a presentation: moves between steps and slides and plays their animations. */
export class Presenter {
  readonly #presentation: Presentation
  readonly #outline: Outline
  readonly #sampler: Sampler
  readonly #onMove: (position: Position) => void
  readonly #responses: Responses = new Map()
  #position: Position
  #slide: BuiltSlide
  #playback: Playback | undefined

  constructor({ presentation, outline, sampler, onMove = () => {} }: PresenterOptions) {
    this.#presentation = presentation
    this.#outline = outline
    this.#sampler = sampler
    this.#onMove = onMove
    this.#position = outline.first
    this.#slide = this.#build(0)
  }

  get position(): Position {
    return this.#position
  }

  get isPlaying(): boolean {
    return this.#playback !== undefined
  }

  /** The speaker notes of the slide on screen. */
  get notes(): string {
    return this.#slide.notes
  }

  /**
   * Shows a position. Every step before it is applied instantly; the step itself is
   * animated when `animate` is set, which replays it after a live reload.
   */
  goTo(position: Position, { animate = false } = {}): void {
    const target = this.#outline.clamp(position)
    this.#slide = this.#build(target.slide)
    this.#playback = undefined
    this.#position = target
    for (let step = 0; step < target.step; step++) this.#finish(this.#slide.steps[step])
    if (animate) this.#play(target.step)
    else this.#finish(this.#slide.steps[target.step])
    this.#onMove(target)
  }

  /** Finishes the running animation, or plays the next step, moving to the next slide when needed. */
  next(): void {
    if (this.#skip()) return
    const next = this.#outline.next(this.#position)
    if (!next) return
    if (next.slide !== this.#position.slide) {
      this.goTo(next, { animate: true })
      return
    }
    this.#position = next
    this.#play(next.step)
    this.#onMove(next)
  }

  /** Goes back to how the previous step left the slide. */
  previous(): void {
    this.goTo(this.#outline.previous(this.#position) ?? this.#position)
  }

  first(): void {
    this.goTo(this.#outline.first, { animate: true })
  }

  last(): void {
    this.goTo(this.#outline.last)
  }

  /** Advances time by `seconds`. */
  tick(seconds: number): void {
    this.#slide.scene.time += seconds
    if (!this.#playback) return
    this.#playback.elapsed += seconds
    this.#advance(this.#playback)
  }

  draw(surface: Surface): void {
    surface.clear(this.#presentation.background)
    this.#slide.scene.draw(surface)
  }

  #build(slide: number): BuiltSlide {
    return this.#presentation.slides[slide].build(this.#responses)
  }

  get #context(): AnimationContext {
    return { scene: this.#slide.scene, sampler: this.#sampler }
  }

  #play(step: number): void {
    const animation = this.#slide.steps[step]
    animation.start(this.#context)
    this.#playback = { animation, elapsed: 0 }
    this.#advance(this.#playback)
  }

  #advance(playback: Playback): void {
    const { animation, elapsed } = playback
    const progress = animation.duration === 0 ? 1 : clamp01(elapsed / animation.duration)
    animation.update(progress)
    if (progress >= 1) this.#playback = undefined
  }

  #finish(animation: Animation): void {
    animation.start(this.#context)
    animation.update(1)
  }

  #skip(): boolean {
    if (!this.#playback) return false
    this.#playback.animation.update(1)
    this.#playback = undefined
    return true
  }
}
