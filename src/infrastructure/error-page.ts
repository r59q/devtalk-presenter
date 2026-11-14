import { element } from './dom.ts'

/** Replaces the page with what went wrong, so a broken script never leaves a blank screen. */
export function renderError(root: HTMLElement, error: unknown): void {
  console.error(error)
  const page = element('section', 'problem')
  const back = element('a', 'back', '← All presentations')
  back.href = '#/'
  page.append(
    element('h1', '', 'This presentation stopped'),
    element('p', 'message', error instanceof Error ? error.message : String(error)),
    element('p', 'hint', 'Fix the script and save it. The page reloads on its own.'),
  )
  const stack = error instanceof Error ? (error.cause instanceof Error ? error.cause : error).stack : undefined
  if (stack) page.append(element('pre', 'stack', stack))
  page.append(back)
  root.replaceChildren(page)
}
