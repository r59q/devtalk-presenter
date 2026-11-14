import type { CatalogEntry } from '../application/catalog.ts'
import { Presenter } from '../application/presenter.ts'
import type { Outline, Position } from '../domain/presentation/outline.ts'
import { CanvasSampler } from './canvas-sampler.ts'
import { CanvasSurface } from './canvas-surface.ts'
import { element } from './dom.ts'
import { bindKeyboard } from './keyboard.ts'
import { bindPointer } from './pointer.ts'
import { formatRoute } from './route.ts'
import { everyFrame, prepare } from './show.ts'
import { Sync } from './sync.ts'
import { Viewport } from './viewport.ts'

/**
 * The presenter's own window: the current step, how the next step will look, the notes and a
 * timer. It follows the audience window, and moving here moves the audience window too.
 */
export async function startSpeakerView(root: HTMLElement, { id, presentation }: CatalogEntry, position: Position): Promise<void> {
  document.title = `Speaker view · ${presentation.title}`
  const { outline, images } = await prepare(presentation)
  const page = layout()
  root.replaceChildren(page.root)

  const sampler = new CanvasSampler(images)
  const current = new CanvasSurface(new Viewport(page.current).context, images)
  const upcoming = new CanvasSurface(new Viewport(page.upcoming).context, images)
  const preview = new Presenter({ presentation, outline, sampler })
  const sync = new Sync(id)
  const presenter: Presenter = new Presenter({
    presentation,
    outline,
    sampler,
    onMove: (position) => {
      history.replaceState(null, '', formatRoute({ id, position }))
      sync.announce(position)
      const next = outline.next(position)
      if (next) preview.goTo(next)
      page.upcoming.classList.toggle('finished', !next)
      page.title.textContent = presentation.slides[position.slide].title
      page.place.textContent = describe(outline, position)
      page.notes.textContent = presenter.notes || 'No notes for this slide.'
    },
  })

  let started = performance.now()
  page.timer.addEventListener('click', () => {
    started = performance.now()
    page.timer.blur()
  })

  sync.follow((position) => presenter.goTo(position, { animate: true }))
  bindKeyboard(presenter)
  bindPointer(page.current, presenter)
  presenter.goTo(position, { animate: true })
  everyFrame((seconds) => {
    presenter.tick(seconds)
    preview.tick(seconds)
    presenter.draw(current)
    preview.draw(upcoming)
    page.timer.textContent = clock((performance.now() - started) / 1000)
  })
}

function layout() {
  const root = element('section', 'speaker')
  const header = element('header')
  const title = element('h1')
  const place = element('span', 'place')
  const timer = element('button', 'timer')
  timer.title = 'Time since the speaker view opened. Click to restart it.'
  header.append(title, place, timer)

  const current = element('div', 'frame current')
  const main = element('div', 'main')
  main.append(current)
  const upcoming = element('div', 'frame upcoming')
  const notes = element('div', 'notes')
  const aside = element('aside')
  aside.append(element('h2', '', 'Next'), upcoming, element('h2', '', 'Notes'), notes)

  root.append(header, main, aside)
  return { root, title, place, timer, current, upcoming, notes }
}

/** E.g. "Slide 3 of 8 · step 1 of 2". */
function describe(outline: Outline, { slide, step }: Position): string {
  const steps = outline.lastStep(slide)
  const where = `Slide ${slide + 1} of ${outline.slideCount}`
  return steps === 0 ? where : `${where} · step ${step} of ${steps}`
}

/** Seconds as m:ss, or h:mm:ss after an hour. */
function clock(seconds: number): string {
  const whole = Math.floor(seconds)
  const [hours, minutes, rest] = [Math.floor(whole / 3600), Math.floor(whole / 60) % 60, whole % 60]
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}
