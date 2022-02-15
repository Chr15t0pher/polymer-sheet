import type { PolymerSheet } from './PolymerSheet'

enum ScrollBarType {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

const SCROLLBAR_SELECTOR_PREFIX = '.polymersheet__scrollbar'
const VIEW_SELECTOR = '#polymersheet__view'

export default class ScrollBar {
  verticalScrollBarElm!: HTMLDivElement
  horizontalScrollBarElm!: HTMLDivElement

  constructor(private polymersheet: PolymerSheet) {}

  mount() {
    const viewElm = document.querySelector(VIEW_SELECTOR)
    const verticalScrollBarElm = document.querySelector(`${SCROLLBAR_SELECTOR_PREFIX}--${ScrollBarType.VERTICAL}`) as HTMLDivElement
    const horizontalScrollBarElm = document.querySelector(`${SCROLLBAR_SELECTOR_PREFIX}--${ScrollBarType.HORIZONTAL}`) as HTMLDivElement

    this.verticalScrollBarElm = verticalScrollBarElm
    this.horizontalScrollBarElm = horizontalScrollBarElm

    // @ts-ignore
    viewElm?.addEventListener('mousewheel', this.handleMouseWheel.bind(this))
    horizontalScrollBarElm?.addEventListener('scroll', this.handleScroll.bind(this))
    verticalScrollBarElm?.addEventListener('scroll', this.handleScroll.bind(this))
  }

  handleMouseWheel(e: WheelEvent) {
    const target = e.target as HTMLElement

    // disable swipe back/forward event
    e.preventDefault()

    if (!target.className.includes(SCROLLBAR_SELECTOR_PREFIX)) {
      const { polymersheet, horizontalScrollBarElm, verticalScrollBarElm } = this
      const { scrollLeft = 0, scrollTop = 0 } = polymersheet.getWorksheet()

      const maxScrollLeft = horizontalScrollBarElm?.scrollWidth - horizontalScrollBarElm?.clientWidth
      const maxScrollTop = verticalScrollBarElm?.scrollHeight - verticalScrollBarElm?.clientHeight
      const newScrollLeft = Math.min(Math.max(e.deltaX + scrollLeft, 0), maxScrollLeft)
      const newScrolTop = Math.min(Math.max(e.deltaY + scrollTop, 0), maxScrollTop)

      // TODO move this to action when observable is done
      horizontalScrollBarElm?.scrollTo({ left: newScrollLeft })
      verticalScrollBarElm?.scrollTo({ top: newScrolTop })

      this.setScrollPosition(newScrollLeft, newScrolTop)
    }
  }

  handleScroll() {
    this.setScrollPosition(this.horizontalScrollBarElm.scrollLeft, this.verticalScrollBarElm.scrollTop)
  }

  setScrollPosition(left: number, top: number) {
    const worksheet = this.polymersheet.getWorksheet()
    worksheet.scrollTop = top
    worksheet.scrollLeft = left
    this.polymersheet.content.draw()
  }
}
