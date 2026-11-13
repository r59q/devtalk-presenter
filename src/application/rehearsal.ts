import { Outline } from '../domain/presentation/outline.ts'
import type { Presentation } from '../domain/presentation/presentation.ts'
import { ImageElement } from '../domain/scene/image.ts'

export interface Rehearsal {
  readonly outline: Outline
  /** Every image the slides show, to load before the show starts. */
  readonly images: readonly string[]
}

/** Builds every slide once to learn how many steps it has and what it needs. */
export function rehearse(presentation: Presentation): Rehearsal {
  const builds = presentation.slides.map((slide) => slide.build(new Map()))
  const images = builds
    .flatMap(({ scene }) => scene.elements)
    .filter((element) => element instanceof ImageElement)
    .map((image) => image.source)
  return {
    outline: new Outline(builds.map(({ steps }) => steps.length)),
    images: [...new Set(images)],
  }
}
