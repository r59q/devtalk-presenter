import type { Presentation } from '../domain/presentation/presentation.ts'

export interface CatalogEntry {
  /** The presentation's folder name, used in the URL. */
  readonly id: string
  readonly presentation: Presentation
}

/** All presentations that can be shown, sorted by id. */
export class Catalog {
  readonly entries: readonly CatalogEntry[]

  constructor(entries: readonly CatalogEntry[]) {
    this.entries = [...entries].sort((a, b) => a.id.localeCompare(b.id))
  }

  find(id: string): CatalogEntry | undefined {
    return this.entries.find((entry) => entry.id === id)
  }
}
