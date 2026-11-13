import type { Sampler } from '../morph/sampler.ts'
import type { Scene } from '../scene/scene.ts'

/** What an animation may use while it plays. */
export interface AnimationContext {
  readonly scene: Scene
  readonly sampler: Sampler
}

/**
 * Something that changes the scene over time.
 *
 * `start` is called once, right before the first `update`, so an animation can capture
 * the state it animates from. `update` receives linear progress from 0 to 1 and must be
 * deterministic: calling it with 1 always produces the final state. That property lets the
 * presenter jump to any step instantly.
 */
export interface Animation {
  /** Duration in seconds. */
  readonly duration: number
  start(context: AnimationContext): void
  update(progress: number): void
}
