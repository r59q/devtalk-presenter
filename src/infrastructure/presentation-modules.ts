import type { CatalogEntry } from '../application/catalog.ts'
import { Presentation } from '../domain/presentation/presentation.ts'

/** A presentation whose script could not be loaded. */
export interface BrokenPresentation {
  readonly id: string
  readonly error: unknown
}

export interface Discovery {
  readonly entries: CatalogEntry[]
  readonly broken: BrokenPresentation[]
}

/** Every `src/presentations/<id>/index.ts`. Vite picks up added and deleted folders while it runs. */
const modules = import.meta.glob<unknown>('../presentations/*/index.ts', { import: 'default' })

/** Loads every presentation. One that fails to load is reported, and the others still work. */
export async function discoverPresentations(): Promise<Discovery> {
  const discovery: Discovery = { entries: [], broken: [] }
  await Promise.all(
    Object.entries(modules).map(async ([path, load]) => {
      const id = path.split('/').at(-2) ?? path
      try {
        const presentation = await load()
        if (!(presentation instanceof Presentation)) throw new Error(`${path} must \`export default presentation(...)\``)
        discovery.entries.push({ id, presentation })
      } catch (error) {
        discovery.broken.push({ id, error })
      }
    }),
  )
  discovery.broken.sort((a, b) => a.id.localeCompare(b.id))
  return discovery
}
