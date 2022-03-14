import { Widget } from './Widget'

import type { Dom } from '../../utils/dom'

export default class ScrollBar extends Widget {
  private readonly verticalScrollBarClassName = 'polymersheet__scrollbar--vertical'
  private readonly verticalScrollBarInnerClassName = 'polymersheet__scrollbar_inner--vertical'
  private readonly horizontalScrollBarClassName = 'polymersheet__scrollbar--horizontal'
  private readonly horizontalScrollBarInnerClassName = 'polymersheet__scrollbar_inner--horizontal'

  private verticalScrollBarNode!: Dom
  private verticalScrollBarInnerNode!: Dom
  private horizontalScrollBarNode!: Dom
  private horizontalScrollBarInnerNode!: Dom

  mount() {
    const { viewNode, viewGridNodes } = this.polymersheet
    const parentNode = viewGridNodes[3]

    parentNode?.prepend(`
			<div class="polymersheet__scrollbar ${this.verticalScrollBarClassName}">
				<div class="${this.verticalScrollBarInnerClassName}"></div>
			</div>
			<div class="polymersheet__scrollbar ${this.horizontalScrollBarClassName}">
				<div class="${this.horizontalScrollBarInnerClassName}"></div>
			</div>
			<div class="polymersheet__scrollbar_corner"></div>
		`)

    this.verticalScrollBarNode = parentNode.find(`.${this.verticalScrollBarClassName}`)
    this.verticalScrollBarInnerNode = parentNode.find(`.${this.verticalScrollBarInnerClassName}`)
    this.horizontalScrollBarNode = parentNode.find(`.${this.horizontalScrollBarClassName}`)
    this.horizontalScrollBarInnerNode = parentNode.find(`.${this.horizontalScrollBarInnerClassName}`)

    this.handleMouseWheel = this.handleMouseWheel.bind(this)
    this.handleScroll = this.handleScroll.bind(this)

    this.update()

    // @ts-ignore
    viewNode.elem().addEventListener('mousewheel', this.handleMouseWheel)
    this.verticalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll)
    this.horizontalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll)
  }

  update() {
    const {
      scrollbarSize,
      cellsContentHeight,
      cellsContentWidth,
      worksheetActualHeight,
      worksheetActualWidth,
    } = this.polymersheet.store

    this.verticalScrollBarNode.css({
      width: `${scrollbarSize}px`,
      height: `${cellsContentHeight}px`
    })

    this.verticalScrollBarInnerNode.css({
      height: `${worksheetActualHeight}px`
    })

    this.horizontalScrollBarNode.css({
      width: `${cellsContentWidth}px`,
      height: `${scrollbarSize}px`
    })

    this.horizontalScrollBarInnerNode.css({
      width: `${worksheetActualWidth}px`
    })

  }

  unmount() {
    // @ts-ignore
    this.polymersheet.viewNode.elem().removeEventListener('mousewheel', this.handleMouseWheel)
    this.verticalScrollBarNode?.elem().removeEventListener('scroll', this.handleScroll)
    this.horizontalScrollBarNode?.elem().removeEventListener('scroll', this.handleScroll)
  }

  private handleMouseWheel(e: WheelEvent) {
    // disable swipe back/forward event
    e.preventDefault()

    const { polymersheet, horizontalScrollBarNode, verticalScrollBarNode } = this
    const { scrollLeft = 0, scrollTop = 0 } = polymersheet.getWorksheet()
    const horizontalScrollBarElm = horizontalScrollBarNode.elem()
    const verticalScrollBarElm = verticalScrollBarNode.elem()

    // 因为 `scrollWidth` 和 `clientWidth` 都是四舍五入取整的，所以这种计算方式和真正的情况有些许误差
    const maxScrollLeft = horizontalScrollBarElm?.scrollWidth - horizontalScrollBarElm?.clientWidth
    const maxScrollTop = verticalScrollBarElm?.scrollHeight - verticalScrollBarElm?.clientHeight
    const newScrollLeft = Math.min(Math.max(e.deltaX + scrollLeft, 0), maxScrollLeft)
    const newScrolTop = Math.min(Math.max(e.deltaY + scrollTop, 0), maxScrollTop)

    // TODO move this to action when observable is done
    horizontalScrollBarElm?.scrollTo({ left: newScrollLeft })
    verticalScrollBarElm?.scrollTo({ top: newScrolTop })

    this.setScrollPosition(newScrollLeft, newScrolTop)
  }

  private handleScroll() {
    this.setScrollPosition(
      this.horizontalScrollBarNode.elem().scrollLeft,
      this.verticalScrollBarNode.elem().scrollTop
    )
  }

  private setScrollPosition(left: number, top: number) {
    const worksheet = this.polymersheet.getWorksheet()
    worksheet.scrollTop = top
    worksheet.scrollLeft = left
    // TODO move this to action when observable is done
    this.polymersheet.update()
  }
}
