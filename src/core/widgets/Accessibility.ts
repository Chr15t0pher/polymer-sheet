import { throttle } from 'throttle-debounce'

import { Widget } from './Widget'

export default class Accesibility extends Widget {
  private removeResizeEventListener!: () => void
  private resizeObserver!: ResizeObserver

  mount() {
    this.updateSize = throttle(50, this.updateSize.bind(this))
    this.addResizeEventListener = this.addResizeEventListener.bind(this)
    this.addResizeEventListener()

    this.resizeObserver = new ResizeObserver(() => {
      this.updateSize()
    })

    this.resizeObserver.observe(this.polymersheet.containerNode.elem())
  }

  unmount() {
    this.removeResizeEventListener?.()
    this.resizeObserver?.disconnect()
  }

  private addResizeEventListener() {
    if (this.removeResizeEventListener) {
      this.polymersheet.store.devicePixelRatio = window.devicePixelRatio
      this.updateSize()
      this.removeResizeEventListener()
    }

    const mqStr = `(resolution: ${window.devicePixelRatio}dppx)`
    const media = window.matchMedia(mqStr)
    media.addEventListener('change', this.addResizeEventListener)
    this.removeResizeEventListener = () => media.removeEventListener('change', this.addResizeEventListener)
  }

  private updateSize() {
    this.polymersheet.calcContainerNodeSize()
    this.polymersheet.update()
  }
}
