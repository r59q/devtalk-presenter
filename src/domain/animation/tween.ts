import { lerp } from '../geometry/numbers.ts'
import type { Animation, AnimationContext } from './animation.ts'
import { ease as easings, type Easing } from './easing.ts'

export interface TweenOptions {
  /** Duration in seconds. */
  readonly duration?: number
  readonly ease?: Easing
}

/** Prepares a tween when it starts and returns how to apply eased progress. */
export type Motion = (context: AnimationContext) => (t: number) => void

export function tween(motion: Motion, { duration = 0.8, ease = easings.inOut }: TweenOptions = {}): Animation {
  let apply: (t: number) => void = () => {}
  return {
    duration,
    start(context) {
      apply = motion(context)
    },
    update(progress) {
      apply(ease(progress))
    },
  }
}

type NumericKey<T> = { [K in keyof T]-?: T[K] extends number ? K : never }[keyof T]

export type NumericProperties<T> = Partial<Record<NumericKey<T>, number>>

/** Tweens numeric properties of any object, from their values when the animation starts. */
export function animate<T extends object>(target: T, to: NumericProperties<T>, options?: TweenOptions): Animation {
  const values = target as Record<PropertyKey, number>
  const destination = to as Record<PropertyKey, number>
  return tween(() => {
    const keys = Object.keys(destination)
    const origin = keys.map((key) => values[key])
    return (t) => keys.forEach((key, index) => (values[key] = lerp(origin[index], destination[key], t)))
  }, options)
}

/** Runs `action` instantly. Useful to change something that is not numeric. */
export function call(action: (context: AnimationContext) => void): Animation {
  let context: AnimationContext
  return {
    duration: 0,
    start(current) {
      context = current
    },
    update(progress) {
      if (progress >= 1) action(context)
    },
  }
}
