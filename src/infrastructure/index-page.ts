import type { Catalog } from '../application/catalog.ts'
import { element } from './dom.ts'
import type { BrokenPresentation } from './presentation-modules.ts'
import { formatRoute } from './route.ts'

/** Lists the presentations to pick from. */
export function renderIndex(root: HTMLElement, catalog: Catalog, broken: readonly BrokenPresentation[] = []): void {
  const page = element('section', 'catalog')
  page.append(element('h1', '', 'Devtalk Presenter'))

  if (catalog.entries.length === 0 && broken.length === 0) {
    page.append(element('p', 'hint', 'No presentations yet. Create one with npm run new -- my-talk'))
  }

  const list = element('ul', 'presentations')
  for (const { id, presentation } of catalog.entries) {
    const slides = presentation.slides.length
    list.append(card(id, presentation.title, `${id} · ${slides} slide${slides === 1 ? '' : 's'}`))
  }
  for (const { id } of broken) list.append(card(id, id, 'Could not be loaded. Open it to see why', 'broken'))
  page.append(list)
  root.replaceChildren(page)
}

function card(id: string, title: string, detail: string, className = ''): HTMLLIElement {
  const link = element('a', `presentation ${className}`.trim())
  link.href = formatRoute({ id, position: { slide: 0, step: 0 } })
  link.append(element('strong', '', title), element('span', '', detail))
  const item = element('li')
  item.append(link)
  return item
}
