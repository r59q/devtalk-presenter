import { clamp01 } from '../geometry/numbers.ts'
import type { Animation, AnimationContext } from './animation.ts'

interface Cue {
  /** Seconds from the start of the timeline. */
  readonly at: number
  readonly animation: Animation
}

/**
 * Plays animations at fixed offsets. Each animation starts lazily, when its offset is
 * reached, so it animates from whatever state the animations before it left behind.
 */
function timeline(cues: readonly Cue[]): Animation {
  const duration = Math.max(0, ...cues.map(({ at, animation }) => at + animation.duration))
  let context: AnimationContext
  let started: boolean[] = []
  let finished: boolean[] = []

  return {
    duration,
    start(current) {
      context = current
      started = cues.map(() => false)
      finished = cues.map(() => false)
    },
    update(progress) {
      const elapsed = progress >= 1 ? duration : progress * duration
      cues.forEach(({ at, animation }, index) => {
        if (finished[index] || elapsed < at) return
        if (!started[index]) {
          animation.start(context)
          started[index] = true
        }
        const local = animation.duration === 0 ? 1 : clamp01((elapsed - at) / animation.duration)
        animation.update(local)
        finished[index] = local >= 1
      })
    },
  }
}

/** Plays all animations at the same time. */
export function parallel(...animations: Animation[]): Animation {
  return timeline(animations.map((animation) => ({ at: 0, animation })))
}

/** Plays animations one after another. */
export function sequence(...animations: Animation[]): Animation {
  let at = 0
  return timeline(
    animations.map((animation) => {
      const cue = { at, animation }
      at += animation.duration
      return cue
    }),
  )
}

/** Starts each animation `gap` seconds after the previous one. */
export function stagger(gap: number, ...animations: Animation[]): Animation {
  return timeline(animations.map((animation, index) => ({ at: index * gap, animation })))
}

/** Does nothing for a while. */
export function wait(seconds: number): Animation {
  return { duration: seconds, start() {}, update() {} }
}

export function delay(seconds: number, animation: Animation): Animation {
  return timeline([{ at: seconds, animation }])
}
