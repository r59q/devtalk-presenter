import type { Animation } from '../animation/animation.ts'
import { parallel } from '../animation/timeline.ts'
import type { Element } from '../scene/element.ts'
import { FieldElement, type FieldOptions, type Responses } from '../scene/field.ts'
import { Scene } from '../scene/scene.ts'

/** What a slide script uses to lay out its scene and choreograph its steps. */
export interface SlideBuilder {
  /** Puts elements on the slide, back to front, and returns the first one. */
  add<T extends Element>(element: T, ...more: Element[]): T
  /** Adds a text input whose value is kept for the rest of the presentation. */
  field(id: string, options?: FieldOptions): FieldElement
  /** Animations that play as soon as the slide is shown. */
  enter(...animations: Animation[]): void
  /** Animations that play together on the next press of the right arrow. */
  step(...animations: Animation[]): void
}

export type SlideScript = (builder: SlideBuilder) => void

/** A slide, ready to be shown: its scene and its steps. The first step is the entrance. */
export interface BuiltSlide {
  readonly scene: Scene
  readonly steps: readonly Animation[]
}

export class Slide {
  readonly title: string
  readonly #script: SlideScript

  constructor(title: string, script: SlideScript) {
    this.title = title
    this.#script = script
  }

  /** Runs the script on a fresh scene. Every build starts from scratch, which makes slides replayable. */
  build(responses: Responses): BuiltSlide {
    const scene = new Scene()
    const entrance: Animation[] = []
    const steps: Animation[] = []

    this.#script({
      add: (element, ...more) => {
        for (const each of [element, ...more]) scene.add(each)
        return element
      },
      field: (id, options) => scene.add(new FieldElement(id, responses, options)),
      enter: (...animations) => entrance.push(...animations),
      step: (...animations) => steps.push(parallel(...animations)),
    })

    return { scene, steps: [parallel(...entrance), ...steps] }
  }
}
