import { Widget } from './Widget'

import type { Dom } from '../../utils/dom'
import type { PolymerSheet } from '../PolymerSheet'
import { observer } from '../observer'

@observer
export default class ScrollBar extends Widget {
  private readonly verticalScrollBarClassName = 'polymersheet__scrollbar--vertical'
  private readonly verticalScrollBarInnerClassName = 'polymersheet__scrollbar_inner--vertical'
  private readonly horizontalScrollBarClassName = 'polymersheet__scrollbar--horizontal'
  private readonly horizontalScrollBarInnerClassName = 'polymersheet__scrollbar_inner--horizontal'

  private verticalScrollBarNode!: Dom
  private verticalScrollBarInnerNode!: Dom
  private horizontalScrollBarNode!: Dom
  private horizontalScrollBarInnerNode!: Dom

  constructor(protected polymersheet: PolymerSheet) {
    super(polymersheet)
    this.handleMouseWheel = this.handleMouseWheel.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
  }

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


    this.render()

    // @ts-ignore
    viewNode.elem().addEventListener('mousewheel', this.handleMouseWheel)
    this.verticalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll)
    this.horizontalScrollBarNode?.elem().addEventListener('scroll', this.handleScroll)
  }

  render() {
    const {
      scrollbarSize,
      cellsContentHeight,
      cellsContentWidth,
      contentPaddingRight,
      contentPaddingBottom,
      worksheetActualHeight,
      worksheetActualWidth,
    } = this.polymersheet.store

    this.verticalScrollBarNode.css({
      width: `${scrollbarSize}px`,
      height: `${cellsContentHeight}px`
    })

    this.verticalScrollBarInnerNode.css({
      height: `${worksheetActualHeight + contentPaddingBottom}px`
    })

    this.horizontalScrollBarNode.css({
      width: `${cellsContentWidth}px`,
      height: `${scrollbarSize}px`
    })

    this.horizontalScrollBarInnerNode.css({
      width: `${worksheetActualWidth + contentPaddingRight}px`
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

    const { deltaX, deltaY } = e
    const { polymersheet, horizontalScrollBarNode, verticalScrollBarNode } = this
    const { scrollLeft = 0, scrollTop = 0 } = polymersheet.store.worksheet
    const horizontalScrollBarElm = horizontalScrollBarNode.elem()
    const verticalScrollBarElm = verticalScrollBarNode.elem()

    let newScrollLeft = 0
    let newScrollTop = 0

    // if has reached the left boundary
    if (scrollLeft <= 0 && deltaX <= 0) {
      newScrollLeft = scrollLeft
    } else {
      // 因为 `scrollWidth` 和 `clientWidth` 都是四舍五入取整的，所以这种计算方式和真正的情况有些许误差
      const maxScrollLeft = horizontalScrollBarElm?.scrollWidth - horizontalScrollBarElm?.clientWidth
      newScrollLeft = Math.min(Math.max(deltaX + scrollLeft, 0), maxScrollLeft)
      if (newScrollLeft !== scrollLeft) {
        horizontalScrollBarElm?.scrollTo({ left: newScrollLeft })
      }
    }

    // if has reached the top boundary
    if (scrollTop <= 0 && deltaY <= 0) {
      newScrollTop = scrollTop
    } else {
      const maxScrollTop = verticalScrollBarElm?.scrollHeight - verticalScrollBarElm?.clientHeight
      newScrollTop = Math.min(Math.max(deltaY + scrollTop, 0), maxScrollTop)
      if (newScrollTop !== scrollTop) {
        verticalScrollBarElm?.scrollTo({ top: newScrollTop })
      }
    }

    this.setScrollPosition(newScrollLeft, newScrollTop)
  }

  private handleScroll() {
    this.setScrollPosition(
      this.horizontalScrollBarNode.elem().scrollLeft,
      this.verticalScrollBarNode.elem().scrollTop
    )
  }

  private setScrollPosition(left: number, top: number) {
    const { worksheet, setWorksheetScrollInfo } = this.polymersheet.store
    const { scrollTop, scrollLeft } = worksheet

    if (scrollTop !== top || scrollLeft !== left) {
      setWorksheetScrollInfo(top, left)
    }
  }
}
