import { Widget } from './Widget'

export default class RowHeader extends Widget {
  private readonly parentNodeSelector = '.polymersheet__view_grid'

  mount() {
    const { rowHeaderWidth, scrollbarSize, cellsContentHeight } = this.polymersheet.store
    const parentNode = this.polymersheet.rootNode.findAll(this.parentNodeSelector)[2]

    parentNode?.append(`
			<div class="polymersheet__header--row" style="width: ${rowHeaderWidth}px; height: ${cellsContentHeight}px"></div>
			<div class="polymersheet__header_shim--row" style="width: ${rowHeaderWidth}px; height: ${scrollbarSize}px"></div>
		`)
  }
}
