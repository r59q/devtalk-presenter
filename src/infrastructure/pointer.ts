import type { Presenter } from '../application/presenter.ts'

/** A click or tap on the stage moves on, like the right arrow. Clicks on a field just focus it. */
export function bindPointer(stage: HTMLElement, presenter: Presenter): void {
  stage.addEventListener('click', (event) => {
    if (event.target instanceof HTMLInputElement) return
    presenter.next()
  })
}
