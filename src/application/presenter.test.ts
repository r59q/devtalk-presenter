import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fadeIn, moveTo } from '../domain/animation/effects.ts'
import { morph } from '../domain/animation/morph.ts'
import type { Sampler } from '../domain/morph/sampler.ts'
import type { PointCloud } from '../domain/morph/point-cloud.ts'
import { Presentation } from '../domain/presentation/presentation.ts'
import { Slide, type SlideScript } from '../domain/presentation/slide.ts'
import { ImageElement } from '../domain/scene/image.ts'
import { RectElement } from '../domain/scene/shapes.ts'
import type { Surface } from '../domain/scene/surface.ts'
import { TextElement } from '../domain/scene/text.ts'
import { Presenter } from './presenter.ts'
import { rehearse } from './rehearsal.ts'

const sampler: Sampler = {
  spacing: 1,
  sample: (element) => [{ x: element.x, y: element.y, color: { r: 255, g: 255, b: 255, a: 1 } }],
}

function present(...scripts: SlideScript[]): Presenter {
  const presentation = new Presentation('Test', scripts.map((script, index) => new Slide(`${index}`, script)))
  return new Presenter({ presentation, outline: rehearse(presentation).outline, sampler })
}

/** A surface that only records the particle clouds drawn on it. */
function particleRecorder(): Surface & { clouds: PointCloud[] } {
  const clouds: PointCloud[] = []
  const ignore = () => {}
  return {
    clouds,
    clear: ignore,
    place: (transform, paint) => transform.opacity > 0 && paint(),
    text: ignore,
    image: ignore,
    rect: ignore,
    circle: ignore,
    line: ignore,
    particles: (cloud) => clouds.push(cloud),
    sketch: ignore,
    field: ignore,
  }
}

test('steps play in order and the last step leads to the next slide', () => {
  let box = new RectElement({ width: 10, height: 10 })
  const presenter = present(
    ({ add, enter, step }) => {
      box = add(new RectElement({ width: 10, height: 10, x: 0 }))
      enter(fadeIn(box, { duration: 1 }))
      step(moveTo(box, 100, 0, { duration: 1 }))
    },
    () => {},
  )

  presenter.goTo({ slide: 0, step: 0 }, { animate: true })
  assert.equal(box.opacity, 0)
  presenter.tick(1)
  assert.equal(box.opacity, 1)

  presenter.next()
  presenter.tick(0.5)
  assert.ok(box.x > 0 && box.x < 100)

  presenter.next()
  assert.equal(box.x, 100, 'pressing next while playing finishes the step')
  assert.equal(presenter.isPlaying, false)

  presenter.next()
  assert.deepEqual(presenter.position, { slide: 1, step: 0 })
})

test('going back rebuilds the slide as the previous step left it', () => {
  let box = new RectElement({ width: 10, height: 10 })
  const presenter = present(({ add, step }) => {
    box = add(new RectElement({ width: 10, height: 10, x: 0 }))
    step(moveTo(box, 50, 0))
    step(moveTo(box, 80, 0))
  })

  presenter.goTo({ slide: 0, step: 2 })
  assert.equal(box.x, 80)

  presenter.previous()
  assert.deepEqual(presenter.position, { slide: 0, step: 1 })
  assert.equal(box.x, 50)
  assert.equal(presenter.isPlaying, false)
})

test('going back from an entrance shows the previous slide as it ended', () => {
  let box = new RectElement({ width: 10, height: 10 })
  const presenter = present(
    ({ add, step }) => {
      box = add(new RectElement({ width: 10, height: 10, x: 0 }))
      step(moveTo(box, 50, 0))
    },
    () => {},
  )

  presenter.goTo({ slide: 1, step: 0 })
  presenter.previous()
  assert.deepEqual(presenter.position, { slide: 0, step: 1 })
  assert.equal(box.x, 50)
})

test('a morph swaps one element for another through particles', () => {
  let from = new TextElement('')
  let to = new TextElement('')
  const presenter = present(({ add, enter }) => {
    from = add(new TextElement('Hello', { x: 0 }))
    to = new TextElement('World', { x: 100 })
    enter(morph(from, to, { duration: 2 }))
  })

  presenter.goTo({ slide: 0, step: 0 }, { animate: true })
  presenter.tick(1)
  const surface = particleRecorder()
  presenter.draw(surface)
  const [cloud] = surface.clouds
  assert.ok(cloud, 'particles are drawn mid-morph')
  assert.ok(cloud[0].x > 0 && cloud[0].x < 100)

  presenter.tick(1)
  assert.equal(from.opacity, 0)
  assert.equal(to.opacity, 1)
})

test('answers typed into fields survive rebuilding the slide', () => {
  let greeting = new TextElement('')
  const presenter = present(({ field, add, step }) => {
    const name = field('name')
    if (!name.value) name.value = 'Ada'
    greeting = add(new TextElement(() => `Hello ${name.value}`))
    step(fadeIn(greeting))
  })

  presenter.goTo({ slide: 0, step: 1 })
  presenter.goTo({ slide: 0, step: 0 })
  assert.equal(greeting.text, 'Hello Ada')
})

test('rehearsal counts steps and collects images', () => {
  const presentation = new Presentation('Test', [
    new Slide('images', ({ add, step }) => {
      add(new ImageElement('/a.png', { width: 10 }), new ImageElement('/a.png', { width: 20 }))
      step()
    }),
  ])
  const { outline, images } = rehearse(presentation)
  assert.deepEqual(outline.last, { slide: 0, step: 1 })
  assert.deepEqual(images, ['/a.png'])
})

test('the presenter shows the notes of the slide on screen', () => {
  const presenter = present(
    ({ notes }) => {
      notes(`
        Start with a story.
        Then the numbers.
      `)
      notes('Breathe.')
    },
    () => {},
  )

  assert.equal(presenter.notes, 'Start with a story.\nThen the numbers.\n\nBreathe.')
  presenter.next()
  assert.equal(presenter.notes, '')
})

test('rehearsal says which slide failed', () => {
  const presentation = new Presentation('Test', [
    new Slide('Fine', () => {}),
    new Slide('Broken', () => {
      throw new Error('oops')
    }),
  ])
  assert.throws(() => rehearse(presentation), { message: 'Slide 2, "Broken", failed: oops' })
})
