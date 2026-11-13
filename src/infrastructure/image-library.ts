/** Loads images once and hands them out when they are ready to draw. */
export class ImageLibrary {
  readonly #images = new Map<string, HTMLImageElement>()

  /** The image, if it has loaded. Unknown images start loading and show up once they are ready. */
  get(source: string): HTMLImageElement | undefined {
    const image = this.#images.get(source)
    if (!image) void this.load(source)
    return image?.complete && image.naturalWidth > 0 ? image : undefined
  }

  load(source: string): Promise<void> {
    const image = this.#images.get(source) ?? new Image()
    this.#images.set(source, image)
    return new Promise((resolve) => {
      if (image.complete && image.src) return resolve()
      image.addEventListener('load', () => resolve(), { once: true })
      image.addEventListener('error', () => {
        console.warn(`Could not load image ${source}`)
        resolve()
      }, { once: true })
      image.src = source
    })
  }

  async loadAll(sources: readonly string[]): Promise<void> {
    await Promise.all(sources.map((source) => this.load(source)))
  }
}
