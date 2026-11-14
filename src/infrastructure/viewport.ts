import { stage } from '../domain/scene/stage.ts'

/** A canvas filling its container, with the stage scaled to fit and centred inside it. */
export class Viewport {
  readonly context: CanvasRenderingContext2D
  /** Holds DOM elements placed in stage coordinates, on top of the canvas. */
  readonly overlay: HTMLElement
  readonly #root: HTMLElement
  readonly #canvas: HTMLCanvasElement

  constructor(root: HTMLElement) {
    this.#root = root
    this.#canvas = document.createElement('canvas')
    this.overlay = document.createElement('div')
    this.overlay.className = 'overlay'
    root.append(this.#canvas, this.overlay)

    const context = this.#canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D is not supported')
    this.context = context

    this.fit()
    new ResizeObserver(() => this.fit()).observe(root)
  }

  fit(): void {
    const { clientWidth: width, clientHeight: height } = this.#root
    const density = window.devicePixelRatio || 1
    const scale = Math.min(width / stage.width, height / stage.height)
    const left = (width - stage.width * scale) / 2
    const top = (height - stage.height * scale) / 2

    this.#canvas.width = Math.round(width * density)
    this.#canvas.height = Math.round(height * density)
    this.#canvas.style.width = `${width}px`
    this.#canvas.style.height = `${height}px`
    this.context.setTransform(scale * density, 0, 0, scale * density, left * density, top * density)
    this.overlay.style.transform = `translate(${left}px, ${top}px) scale(${scale})`
  }
}
