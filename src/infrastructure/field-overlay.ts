import type { FieldElement } from '../domain/scene/field.ts'

/**
 * Real `<input>` elements laid over the canvas for the fields in the scene. Inputs are kept in
 * sync every frame and removed once their field is no longer drawn.
 */
export class FieldOverlay {
  readonly #root: HTMLElement
  readonly #inputs = new Map<FieldElement, HTMLInputElement>()
  readonly #shown = new Set<FieldElement>()

  constructor(root: HTMLElement) {
    this.#root = root
  }

  show(field: FieldElement): void {
    const input = this.#inputs.get(field) ?? this.#create(field)
    this.#shown.add(field)
    if (document.activeElement !== input && input.value !== field.value) input.value = field.value
    Object.assign(input.style, {
      left: `${field.x}px`,
      top: `${field.y}px`,
      width: `${field.width}px`,
      fontSize: `${field.size}px`,
      opacity: `${field.opacity}`,
      transform: `translate(-50%, -50%) rotate(${field.rotation}deg) scale(${field.scale})`,
    })
  }

  /** Call once per frame, after drawing, to remove inputs whose field was not drawn. */
  flush(): void {
    for (const [field, input] of this.#inputs) {
      if (this.#shown.has(field)) continue
      input.remove()
      this.#inputs.delete(field)
    }
    this.#shown.clear()
  }

  #create(field: FieldElement): HTMLInputElement {
    const input = document.createElement('input')
    input.className = 'field'
    input.placeholder = field.placeholder
    input.value = field.value
    input.spellcheck = false
    input.autocomplete = 'off'
    input.addEventListener('input', () => (field.value = input.value))
    this.#root.append(input)
    this.#inputs.set(field, input)
    return input
  }
}
