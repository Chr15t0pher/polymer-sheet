import { Widget } from './Widget'

import type { Dom } from '../../utils'
import { observer } from '../observer'

@observer
export default class RowHeader extends Widget {
  private readonly rowClassName = 'polymersheet__header--row'
  private readonly rowShimClassName = 'polymersheet__header_shim--row'

  private rowNode!: Dom
  private rowShimNode!: Dom

  mount() {
    const parentNode = this.polymersheet.viewGridNodes[2]

    parentNode?.append(`
			<div class="${this.rowClassName}"></div>
			<div class="${this.rowShimClassName}"></div>
		`)


    this.rowNode = parentNode.find(`.${this.rowClassName}`)
    this.rowShimNode = parentNode.find(`.${this.rowShimClassName}`)

    this.render()
  }

  render() {
    const { rowHeaderWidth, scrollbarSize, cellsContentHeight } = this.polymersheet.store

    this.rowNode.css({
      width: `${rowHeaderWidth}px`,
      height: `${cellsContentHeight}px`
    })

    this.rowShimNode.css({
      width: `${rowHeaderWidth}px`,
      height: `${scrollbarSize}px`
    })
  }
}
