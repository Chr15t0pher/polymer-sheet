import { Widget } from './Widget'

export default class UpperLeftCorner extends Widget {
  private readonly parentNodeSelector = '.polymersheet__view_grid'

  mount() {
    const { rowHeaderWidth, columnHeaderHeight } = this.polymersheet.store
    const parentNode = this.polymersheet.rootNode.findAll(this.parentNodeSelector)[0]

    parentNode?.append(`
			<div class="polymersheet__upper_left_corner" style="width: ${rowHeaderWidth}px; height: ${columnHeaderHeight}px;"></div>
		`)
  }
}
