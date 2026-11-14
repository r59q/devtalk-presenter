import './style.css'
import { Catalog } from './application/catalog.ts'
import { renderIndex } from './infrastructure/index-page.ts'
import { discoverPresentations } from './infrastructure/presentation-modules.ts'
import { parseRoute } from './infrastructure/route.ts'
import { startShow } from './infrastructure/show.ts'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('Missing #app element')

const catalog = new Catalog(discoverPresentations())
const route = parseRoute(location.hash)
const entry = route && catalog.find(route.id)

// Picking a presentation, or editing the URL by hand, starts over from a clean page.
window.addEventListener('hashchange', () => location.reload())

if (route && entry) await startShow(root, entry, route.position)
else renderIndex(root, catalog)
