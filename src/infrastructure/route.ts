import type { Position } from '../domain/presentation/outline.ts'

/** Which presentation is shown, and where. Kept in the URL so live reloads come back to the same step. */
export interface Route {
  readonly id: string
  readonly position: Position
}

/** Reads `#/<presentation>/<slide>/<step>`, where slides count from 1 and step 0 is the entrance. */
export function parseRoute(hash: string): Route | undefined {
  const [id, slide, step] = hash.replace(/^#\/?/, '').split('/')
  if (!id) return undefined
  return {
    id: decodeURIComponent(id),
    position: { slide: Math.max(0, wholeNumber(slide, 1) - 1), step: Math.max(0, wholeNumber(step, 0)) },
  }
}

export function formatRoute({ id, position }: Route): string {
  return `#/${encodeURIComponent(id)}/${position.slide + 1}/${position.step}`
}

function wholeNumber(text: string | undefined, fallback: number): number {
  const value = Number.parseInt(text ?? '', 10)
  return Number.isFinite(value) ? value : fallback
}
