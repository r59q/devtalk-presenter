import { Element, type Placement } from './element.ts'
import type { Surface } from './surface.ts'

/**
 * What the audience typed, by field id. It outlives a single slide build, so answers
 * survive navigating back and forth.
 */
export type Responses = Map<string, string>

export interface FieldOptions extends Placement {
  readonly placeholder?: string
  readonly width?: number
  /** Font size. */
  readonly size?: number
}

/** A text input the presenter can type into while presenting. */
export class FieldElement extends Element {
  readonly id: string
  readonly placeholder: string
  width: number
  size: number
  readonly #responses: Responses

  constructor(id: string, responses: Responses, options: FieldOptions = {}) {
    super(options)
    this.id = id
    this.#responses = responses
    this.placeholder = options.placeholder ?? ''
    this.width = options.width ?? 640
    this.size = options.size ?? 40
  }

  get value(): string {
    return this.#responses.get(this.id) ?? ''
  }

  set value(value: string) {
    this.#responses.set(this.id, value)
  }

  protected paint(surface: Surface): void {
    surface.field(this)
  }
}
