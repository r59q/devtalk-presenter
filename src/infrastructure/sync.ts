import type { Position } from '../domain/presentation/outline.ts'

/** Keeps every window showing the same presentation, such as the audience and speaker views, on the same step. */
export class Sync {
  readonly #channel: BroadcastChannel
  #following = false

  constructor(id: string) {
    this.#channel = new BroadcastChannel(`devtalk-presenter/${id}`)
  }

  /** Tells the other windows where this one moved, unless it was only following them. */
  announce(position: Position): void {
    if (!this.#following) this.#channel.postMessage(position)
  }

  /** Calls `move` whenever another window moves. */
  follow(move: (position: Position) => void): void {
    this.#channel.addEventListener('message', ({ data }: MessageEvent<Position>) => {
      this.#following = true
      try {
        move(data)
      } finally {
        this.#following = false
      }
    })
  }
}
