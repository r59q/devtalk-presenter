import type { Presenter } from '../application/presenter.ts'

const actions: Record<string, (presenter: Presenter) => void> = {
  ArrowRight: (presenter) => presenter.next(),
  ArrowDown: (presenter) => presenter.next(),
  PageDown: (presenter) => presenter.next(),
  ' ': (presenter) => presenter.next(),
  ArrowLeft: (presenter) => presenter.previous(),
  ArrowUp: (presenter) => presenter.previous(),
  PageUp: (presenter) => presenter.previous(),
  Home: (presenter) => presenter.first(),
  End: (presenter) => presenter.last(),
  f: () => toggleFullscreen(),
}

/**
 * Arrow keys (and presentation clickers, which send them or Page Up/Down) move through the
 * presentation. While typing in a field, keys belong to the field: Enter leaves it and moves
 * on, Escape just leaves it.
 */
export function bindKeyboard(presenter: Presenter): void {
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) {
      if (event.key === 'Enter' || event.key === 'Escape') event.target.blur()
      if (event.key === 'Enter') presenter.next()
      return
    }
    const action = actions[event.key]
    if (!action || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    action(presenter)
  })
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen()
}
