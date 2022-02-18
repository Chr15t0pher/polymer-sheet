import { Widget } from './Widget'

export default class ColumnHeader extends Widget {
  private readonly parentNodeSelector = '.polymersheet__view_grid'

  mount() {
    const { cellsContentWidth, columnHeaderHeight, scrollbarSize } = this.polymersheet.store
    const parentNode = this.polymersheet.rootNode.findAll(this.parentNodeSelector)[1]

    parentNode?.append(`
			<div class="polymersheet__header--col" style="width: ${cellsContentWidth}px; height: ${columnHeaderHeight}px; "></div>
			<div class="polymersheet__header_shim--col" style="width: ${scrollbarSize}px; height: ${columnHeaderHeight}px"></div>
		`)
  }
}
