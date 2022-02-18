import { Widget } from './Widget'

export default class CellsOverlay extends Widget {
  private readonly parentNodeSelector = '.polymersheet__view_grid'

  mount() {
    const { cellsContentWidth, cellsContentHeight } = this.polymersheet.store
    const parentNode = this.polymersheet.rootNode.findAll(this.parentNodeSelector)[3]

    parentNode?.append(`
			<div class="polymersheet__cells_overlay" style="width: ${cellsContentWidth}px; height: ${cellsContentHeight}px"></div>
		`)
  }
}

