import type { Catalog } from '../application/catalog.ts'
import { formatRoute } from './route.ts'

/** Lists the presentations to pick from. */
export function renderIndex(root: HTMLElement, catalog: Catalog): void {
  const page = element('section', 'catalog')
  page.append(element('h1', '', 'Devtalk Presenter'))

  if (catalog.entries.length === 0) {
    page.append(element('p', 'hint', 'No presentations yet. Create one with npm run new -- my-talk'))
  }

  const list = element('ul', 'presentations')
  for (const { id, presentation } of catalog.entries) {
    const link = element('a', 'presentation')
    link.href = formatRoute({ id, position: { slide: 0, step: 0 } })
    const slides = presentation.slides.length
    link.append(element('strong', '', presentation.title), element('span', '', `${id} · ${slides} slide${slides === 1 ? '' : 's'}`))
    const item = element('li')
    item.append(link)
    list.append(item)
  }
  page.append(list)
  root.replaceChildren(page)
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}
