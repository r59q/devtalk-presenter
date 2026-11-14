import type { CatalogEntry } from '../application/catalog.ts'
import { Presenter } from '../application/presenter.ts'
import { rehearse } from '../application/rehearsal.ts'
import type { Position } from '../domain/presentation/outline.ts'
import { CanvasSampler } from './canvas-sampler.ts'
import { CanvasSurface } from './canvas-surface.ts'
import { FieldOverlay } from './field-overlay.ts'
import { ImageLibrary } from './image-library.ts'
import { bindKeyboard } from './keyboard.ts'
import { bindPointer } from './pointer.ts'
import { formatRoute } from './route.ts'
import { Viewport } from './viewport.ts'

/** Starts presenting in the browser at `position`, replaying that step. */
export async function startShow(root: HTMLElement, { id, presentation }: CatalogEntry, position: Position): Promise<void> {
  document.title = presentation.title
  const images = new ImageLibrary()
  const { outline, images: sources } = rehearse(presentation)
  await images.loadAll(sources)

  const viewport = new Viewport(root)
  const fields = new FieldOverlay(viewport.overlay)
  const surface = new CanvasSurface(viewport.context, images, fields)
  const presenter = new Presenter({
    presentation,
    outline,
    sampler: new CanvasSampler(images),
    onMove: (position) => history.replaceState(null, '', formatRoute({ id, position })),
  })

  bindKeyboard(presenter)
  bindPointer(root, presenter)
  presenter.goTo(position, { animate: true })
  everyFrame((seconds) => {
    presenter.tick(seconds)
    presenter.draw(surface)
    fields.flush()
  })
}

function everyFrame(callback: (seconds: number) => void): void {
  let last = performance.now()
  const frame = (now: number) => {
    // Cap the step so returning to a background tab does not skip whole animations.
    callback(Math.min(0.1, Math.max(0, now - last) / 1000))
    last = now
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
