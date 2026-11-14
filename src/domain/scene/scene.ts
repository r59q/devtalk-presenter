import type { Element } from './element.ts'
import type { Surface } from './surface.ts'

/** The elements on screen, back to front. */
export class Scene {
  readonly #elements: Element[] = []
  /** Seconds since the slide was shown. */
  time = 0

  get elements(): readonly Element[] {
    return this.#elements
  }

  add<T extends Element>(element: T): T {
    if (!this.has(element)) this.#elements.push(element)
    return element
  }

  has(element: Element): boolean {
    return this.#elements.includes(element)
  }

  remove(element: Element): void {
    const index = this.#elements.indexOf(element)
    if (index >= 0) this.#elements.splice(index, 1)
  }

  draw(surface: Surface): void {
    for (const element of this.#elements) element.draw(surface, this.time)
  }
}
