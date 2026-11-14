import { Outline } from '../domain/presentation/outline.ts'
import type { Presentation } from '../domain/presentation/presentation.ts'
import type { BuiltSlide, Slide } from '../domain/presentation/slide.ts'
import { ImageElement } from '../domain/scene/image.ts'

export interface Rehearsal {
  readonly outline: Outline
  /** Every image the slides show, to load before the show starts. */
  readonly images: readonly string[]
}

/** Builds every slide once to learn how many steps it has and what it needs. */
export function rehearse(presentation: Presentation): Rehearsal {
  const builds = presentation.slides.map(tryOut)
  const images = builds
    .flatMap(({ scene }) => scene.elements)
    .filter((element) => element instanceof ImageElement)
    .map((image) => image.source)
  return {
    outline: new Outline(builds.map(({ steps }) => steps.length)),
    images: [...new Set(images)],
  }
}

/** Builds a slide, saying which one it was if its script fails. */
function tryOut(slide: Slide, index: number): BuiltSlide {
  try {
    return slide.build(new Map())
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Slide ${index + 1}, "${slide.title}", failed: ${reason}`, { cause: error })
  }
}
