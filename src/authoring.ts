/**
 * Everything a presentation script needs, in one import:
 *
 *     import { presentation, slide, text, fadeIn } from '../../authoring.ts'
 */
import { Presentation, type PresentationOptions } from './domain/presentation/presentation.ts'
import { Slide, type SlideScript } from './domain/presentation/slide.ts'
import { ImageElement, type ImageOptions } from './domain/scene/image.ts'
import { CircleElement, LineElement, RectElement, type CircleOptions, type LineOptions, type RectOptions } from './domain/scene/shapes.ts'
import { SketchElement } from './domain/scene/sketch.ts'
import { fonts, TextElement, type TextContent, type TextOptions } from './domain/scene/text.ts'
import type { Placement } from './domain/scene/element.ts'
import type { Sketch } from './domain/scene/surface.ts'

export type { Animation } from './domain/animation/animation.ts'
export type { Easing } from './domain/animation/easing.ts'
export type { Element, Placement } from './domain/scene/element.ts'
export type { FieldElement } from './domain/scene/field.ts'
export type { SlideBuilder } from './domain/presentation/slide.ts'
export { ease } from './domain/animation/easing.ts'
export { delay, parallel, sequence, stagger, wait } from './domain/animation/timeline.ts'
export { animate, call, tween } from './domain/animation/tween.ts'
export { morph } from './domain/animation/morph.ts'
export { drawLine, fadeIn, fadeOut, moveTo, popIn, recolor, rotateTo, scaleTo, slideIn, typewrite } from './domain/animation/effects.ts'
export { stage } from './domain/scene/stage.ts'
export { fonts }

export const palette = {
  background: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  foreground: '#e6edf3',
  muted: '#8b949e',
  blue: '#58a6ff',
  green: '#3fb950',
  purple: '#bc8cff',
  orange: '#f0883e',
  red: '#ff7b72',
} as const

export function presentation(title: string, slides: readonly Slide[], options?: PresentationOptions): Presentation {
  return new Presentation(title, slides, options)
}

/** A slide. Create its elements inside the script: it runs again every time the slide is shown. */
export function slide(title: string, script: SlideScript): Slide {
  return new Slide(title, script)
}

/** Text, centred on its position. Pass a function to compute it on every frame. */
export function text(content: TextContent, options?: TextOptions): TextElement {
  return new TextElement(content, options)
}

/** Monospaced, left-aligned text: its position is the middle of its left edge. */
export function code(source: string, options?: TextOptions): TextElement {
  return new TextElement(source, { font: fonts.mono, size: 34, weight: 400, align: 'left', lineHeight: 1.5, ...options })
}

/** An image from a URL, e.g. `import logo from './logo.svg'`. */
export function image(source: string, options: ImageOptions): ImageElement {
  return new ImageElement(source, options)
}

export function rect(options: RectOptions): RectElement {
  return new RectElement(options)
}

export function circle(options: CircleOptions): CircleElement {
  return new CircleElement(options)
}

export function line(options: LineOptions): LineElement {
  return new LineElement(options)
}

/** Draw anything with the Canvas 2D API. Coordinates are stage pixels; `time` is seconds since the slide was shown. */
export function sketch(draw: Sketch, placement?: Placement): SketchElement {
  return new SketchElement(draw, placement)
}
