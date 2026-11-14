import { mixColors, paint, type Color, type ColorValue } from '../geometry/color.ts'
import type { Element } from '../scene/element.ts'
import type { LineElement } from '../scene/shapes.ts'
import type { TextElement } from '../scene/text.ts'
import type { Animation } from './animation.ts'
import { ease } from './easing.ts'
import { animate, tween, type TweenOptions } from './tween.ts'

// Effects that make an element appear hide it straight away, so it stays hidden until the
// step that reveals it plays.

export function fadeIn(element: Element, options?: TweenOptions): Animation {
  const opacity = element.opacity
  element.opacity = 0
  return animate(element, { opacity }, options)
}

export function fadeOut(element: Element, options?: TweenOptions): Animation {
  return animate(element, { opacity: 0 }, options)
}

/** Grows the element from nothing with a little overshoot. */
export function popIn(element: Element, options?: TweenOptions): Animation {
  const { scale, opacity } = element
  element.scale = 0
  element.opacity = 0
  return animate(element, { scale, opacity }, { ease: ease.back, duration: 0.6, ...options })
}

export function moveTo(element: Element, x: number, y: number, options?: TweenOptions): Animation {
  return animate(element, { x, y }, options)
}

/** Moves the element to where it is now, starting from an offset. */
export function slideIn(element: Element, dx: number, dy: number, options?: TweenOptions): Animation {
  const { x, y, opacity } = element
  element.x += dx
  element.y += dy
  element.opacity = 0
  return animate(element, { x, y, opacity }, { ease: ease.out, ...options })
}

export function scaleTo(element: Element, scale: number, options?: TweenOptions): Animation {
  return animate(element, { scale }, options)
}

export function rotateTo(element: Element, rotation: number, options?: TweenOptions): Animation {
  return animate(element, { rotation }, options)
}

type Colored = { color: Color } | { fill: Color | undefined }

/** Blends to another color: the color of text and lines, the fill of shapes. */
export function recolor(target: Colored, color: ColorValue, options?: TweenOptions): Animation {
  const destination = paint(color)
  const colors = target as Record<string, Color | undefined>
  const key = 'color' in target ? 'color' : 'fill'
  return tween(() => {
    const origin = colors[key] ?? { ...destination, a: 0 }
    return (t) => (colors[key] = mixColors(origin, destination, t))
  }, options)
}

/** Types the text out character by character. */
export function typewrite(text: TextElement, { duration = text.text.length * 0.04, ...options }: TweenOptions = {}): Animation {
  text.reveal = 0
  return animate(text, { reveal: 1 }, { ease: ease.linear, duration, ...options })
}

/** Draws the line in from its start. */
export function drawLine(line: LineElement, options?: TweenOptions): Animation {
  line.progress = 0
  return animate(line, { progress: 1 }, { ease: ease.out, ...options })
}
