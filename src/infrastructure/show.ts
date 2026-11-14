import type { CatalogEntry } from '../application/catalog.ts'
import { Presenter } from '../application/presenter.ts'
import { rehearse } from '../application/rehearsal.ts'
import type { Outline, Position } from '../domain/presentation/outline.ts'
import type { Presentation } from '../domain/presentation/presentation.ts'
import { CanvasSampler } from './canvas-sampler.ts'
import { CanvasSurface } from './canvas-surface.ts'
import { FieldOverlay } from './field-overlay.ts'
import { ImageLibrary } from './image-library.ts'
import { bindKeyboard } from './keyboard.ts'
import { bindPointer } from './pointer.ts'
import { formatRoute } from './route.ts'
import { Sync } from './sync.ts'
import { Viewport } from './viewport.ts'

/** Starts presenting in the browser at `position`, replaying that step. */
export async function startShow(root: HTMLElement, { id, presentation }: CatalogEntry, position: Position): Promise<void> {
  document.title = presentation.title
  const { outline, images } = await prepare(presentation)

  const viewport = new Viewport(root)
  const fields = new FieldOverlay(viewport.overlay)
  const surface = new CanvasSurface(viewport.context, images, fields)
  const sync = new Sync(id)
  const presenter = new Presenter({
    presentation,
    outline,
    sampler: new CanvasSampler(images),
    onMove: (position) => {
      history.replaceState(null, '', formatRoute({ id, position }))
      sync.announce(position)
    },
  })

  sync.follow((position) => presenter.goTo(position, { animate: true }))
  bindKeyboard(presenter, { s: () => openSpeakerView(id) })
  bindPointer(root, presenter)
  presenter.goTo(position, { animate: true })
  everyFrame((seconds) => {
    presenter.tick(seconds)
    presenter.draw(surface)
    fields.flush()
  })
}

/** Rehearses the presentation and loads its images. */
export async function prepare(presentation: Presentation): Promise<{ outline: Outline; images: ImageLibrary }> {
  const images = new ImageLibrary()
  const { outline, images: sources } = rehearse(presentation)
  await images.loadAll(sources)
  return { outline, images }
}

export function everyFrame(callback: (seconds: number) => void): void {
  let last = performance.now()
  const frame = (now: number) => {
    // Cap the step so returning to a background tab does not skip whole animations.
    callback(Math.min(0.1, Math.max(0, now - last) / 1000))
    last = now
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/** Opens the speaker view in its own window, or brings it forward if it is open already. */
function openSpeakerView(id: string): void {
  window.open(`?speaker${location.hash}`, `devtalk-presenter/${id}/speaker`)?.focus()
}
