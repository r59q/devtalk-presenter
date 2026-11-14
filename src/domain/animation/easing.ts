/** Maps linear progress (0–1) to eased progress. */
export type Easing = (t: number) => number

const linear: Easing = (t) => t
const easeIn: Easing = (t) => t * t * t
const easeOut: Easing = (t) => 1 - (1 - t) ** 3
const easeInOut: Easing = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const overshoot = 1.70158
const back: Easing = (t) => 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2

const elastic: Easing = (t) =>
  t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1

export const ease = { linear, in: easeIn, out: easeOut, inOut: easeInOut, back, elastic } as const
