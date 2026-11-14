import './style.css'
import { Catalog } from './application/catalog.ts'
import { renderError } from './infrastructure/error-page.ts'
import { renderIndex } from './infrastructure/index-page.ts'
import { discoverPresentations } from './infrastructure/presentation-modules.ts'
import { parseRoute } from './infrastructure/route.ts'
import { startShow } from './infrastructure/show.ts'
import { startSpeakerView } from './infrastructure/speaker-view.ts'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('Missing #app element')

// Picking a presentation, or editing the URL by hand, starts over from a clean page.
window.addEventListener('hashchange', () => location.reload())
// A slide that throws while it plays, e.g. in a sketch, shows what went wrong instead of freezing.
window.addEventListener('error', ({ error }) => error && renderError(root, error))

const { entries, broken } = await discoverPresentations()
const catalog = new Catalog(entries)
const route = parseRoute(location.hash)
const entry = route && catalog.find(route.id)
const failure = route && broken.find(({ id }) => id === route.id)
const start = new URLSearchParams(location.search).has('speaker') ? startSpeakerView : startShow

try {
  if (failure) throw failure.error
  if (route && entry) await start(root, entry, route.position)
  else renderIndex(root, catalog, broken)
} catch (error) {
  renderError(root, error)
}
