import { Widget } from './Widget'

import type { Dom } from '../../utils'

export default class ColumnHeader extends Widget {
  private readonly columnClassName = 'polymersheet__header--col'
  private readonly columnShimClassName = 'polymersheet__header_shim--col'

  private columnNode!: Dom
  private columnShimNode!: Dom

  mount() {
    const parentNode = this.polymersheet.viewGridNodes[1]

    parentNode?.append(`
			<div class="${this.columnClassName}"></div>
			<div class="${this.columnShimClassName}"></div>
		`)

    this.columnNode = parentNode.find(`.${this.columnClassName}`)
    this.columnShimNode = parentNode.find(`.${this.columnShimClassName}`)

    this.update()
  }

  update() {
    const { cellsContentWidth, columnHeaderHeight, scrollbarSize } = this.polymersheet.store

    this.columnNode.css({
      width: `${cellsContentWidth}px`,
      height: `${columnHeaderHeight}px`
    })

    this.columnShimNode.css({
      width: `${scrollbarSize}px`,
      height: `${columnHeaderHeight}px`
    })
  }
}
