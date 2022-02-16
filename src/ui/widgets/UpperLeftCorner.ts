import { Widget } from './Widget'

export default class UpperLeftCorner extends Widget {

  mount() {
    const { rowHeaderWidth, columnHeaderHeight } = this.polymersheet.store
    const parentNode = this.polymersheet.viewGridNodes[0]

    parentNode?.append(`
			<div class="polymersheet__upper_left_corner" style="width: ${rowHeaderWidth}px; height: ${columnHeaderHeight}px;"></div>
		`)
  }
}
