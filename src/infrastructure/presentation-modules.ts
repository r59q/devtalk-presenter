import type { CatalogEntry } from '../application/catalog.ts'
import { Presentation } from '../domain/presentation/presentation.ts'

/** Every `src/presentations/<id>/index.ts`. Vite picks up added and deleted folders while it runs. */
const modules = import.meta.glob<unknown>('../presentations/*/index.ts', { eager: true, import: 'default' })

export function discoverPresentations(): CatalogEntry[] {
  return Object.entries(modules).flatMap(([path, presentation]) => {
    const id = path.split('/').at(-2) ?? path
    if (presentation instanceof Presentation) return [{ id, presentation }]
    console.warn(`${path} must \`export default presentation(...)\``)
    return []
  })
}
