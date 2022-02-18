import { Widget } from './Widget'

import type { Dom } from '../../utils/dom'

enum ScrollBarClassName {
  VERTICAL = 'polymersheet__scrollbar--vertical',
  HORIZONTAL = 'polymersheet__scrollbar--horizontal'
}

export default class ScrollBar extends Widget {
  private readonly viewSelector = '#polymersheet__view'
  private readonly parentNodeSelector = '.polymersheet__view_grid'

  private verticalScrollBarNode!: Dom<HTMLElement>
  private horizontalScrollBarNode!: Dom<HTMLElement>

  private get horizontalScrollBarWidth() {
    const { scrollbarSize, cellsContentWidth } = this.polymersheet.store
    return cellsContentWidth + scrollbarSize
  }

  mount() {
    const { rootNode } = this.polymersheet
    const {
      scrollbarSize,
      cellsContentHeight,
      worksheetActualHeight,
      worksheetActualWidth,
    } = this.polymersheet.store
    const parentNode = rootNode.findAll(this.parentNodeSelector)[3]

    parentNode?.prepend(`
			<div class="polymersheet__scrollbar ${ScrollBarClassName.VERTICAL}" style="width: ${scrollbarSize}px; height: ${cellsContentHeight}px;">
				<div style="height: ${worksheetActualHeight}px"></div>
			</div>
			<div class="polymersheet__scrollbar ${ScrollBarClassName.HORIZONTAL}" style="width: ${this.horizontalScrollBarWidth}px; height: ${scrollbarSize}px;">
				<div style="width: ${worksheetActualWidth}px;"></div>
			</div>
		`)

    const viewNode = rootNode.find(this.viewSelector)
    this.verticalScrollBarNode = parentNode.find(`.${ScrollBarClassName.VERTICAL}`)
    this.horizontalScrollBarNode = parentNode.find(`.${ScrollBarClassName.HORIZONTAL}`)

    // @ts-ignore
    viewNode.elem().addEventListener('mousewheel', this.handleMouseWheel.bind(this))
    this.verticalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll.bind(this))
    this.horizontalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll.bind(this))
  }

  private handleMouseWheel(e: WheelEvent) {
    // disable swipe back/forward event
    e.preventDefault()

    const { polymersheet, horizontalScrollBarNode, verticalScrollBarNode } = this
    const { scrollLeft = 0, scrollTop = 0 } = polymersheet.getWorksheet()
    const horizontalScrollBarElm = horizontalScrollBarNode.elem()
    const verticalScrollBarElm = verticalScrollBarNode.elem()

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
