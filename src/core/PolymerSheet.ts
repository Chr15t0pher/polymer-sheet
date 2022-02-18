import './index.styl'

import store from './Store'

import Widgets from './widgets'

import { mergeOptions, d, isNullish } from '../utils'
import { PolymerSheetOptions, Sheet, SheetId } from '../declare'

import type { Widget } from './widgets/Widget'
import type { Dom } from '../utils'

export class PolymerSheet {
  store = store

  widgets: Widget[] = []

  rootNode!: Dom

  constructor(options: Partial<PolymerSheetOptions>) {
    this.store = mergeOptions(this.store, options)
    this.widgets = Widgets.map(C => new C(this))
    const { sheets, worksheetId } = this.store

    if (sheets.length > 0) {
      const defaultWorksheetId = sheets.some((sheet) => sheet.id === worksheetId)
        ? worksheetId
        : sheets[0].id
      this.setWorksheet(defaultWorksheetId)
    }
  }

  mount() {
    this.renderSkeleton()
    this.calcRootNodeSize()
    this.widgets.forEach(w => w.mount())
  }

  update() {
    this.widgets.forEach(w => w.update())
  }

  setWorksheet(sheetId: SheetId) {
    this.store.worksheetId = sheetId
    const worksheet = this.getWorksheet()
    if (worksheet) {
      this.calcWorksheetActualSize(worksheet)
    }
  }

  getWorksheet() {
    return this.store.sheets.filter(sheet => sheet.id === this.store.worksheetId)[0]
  }

  private renderSkeleton() {
    this.rootNode = d(this.store.containerId)
    this.rootNode.append(`
			<div id="polymersheet">
				<div id="polymersheet__view">
					<table>
						<tr>
							<td class="polymersheet__view_grid"></td>
							<td class="polymersheet__view_grid"></td>
						</tr>
						<tr>
							<td class="polymersheet__view_grid"></td>
							<td class="polymersheet__view_grid"></td>
						</tr>
					</table>
				</div>
			</div>
		`)
  }

  private calcWorksheetActualSize(sheet: Sheet) {
    const rowLen = sheet.cells.length
    const columnLen = sheet.cells[0].length
    for (let i = 0; i < rowLen; i++) {
      let rowHeight = this.store.defaultRowHeight

      if (sheet.rowsHidden && sheet.rowsHidden.includes(i)) {
        this.store.horizontalLinesPosition.push(this.store.worksheetActualHeight)
        continue
      }

      if (sheet.rowsHeightMap && !isNullish(sheet.rowsHeightMap[i])) {
        rowHeight = sheet.rowsHeightMap[i]
      }

      this.store.worksheetActualHeight += Math.round(rowHeight)
      this.store.horizontalLinesPosition.push(this.store.worksheetActualHeight)
    }

    for (let i = 0; i < columnLen; i++) {
      let columnWidth = this.store.defaultColWidth

      if (sheet.colsHidden && sheet.colsHidden.includes(i)) {
        this.store.verticalLinesPosition.push(this.store.worksheetActualWidth)
        continue
      }

      if (sheet.colsWidthMap && !isNullish(sheet.colsWidthMap[i])) {
        columnWidth = sheet.colsWidthMap[i]
      }

      this.store.worksheetActualWidth += Math.round(columnWidth)
      this.store.verticalLinesPosition.push(this.store.worksheetActualWidth)
    }
  }

  private calcRootNodeSize() {
    const {
      rowHeaderWidth,
      toolbarHeight,
      columnHeaderHeight,
      bottomBarHeight,
      scrollbarSize
    } = this.store

    this.store.rootNodeWidth = this.rootNode.width()
    this.store.rootNodeHeight = this.rootNode.height()
    this.store.contentWidth = this.store.rootNodeWidth - scrollbarSize
    this.store.contentHeight = this.store.rootNodeHeight - scrollbarSize - toolbarHeight - bottomBarHeight
    this.store.cellsContentWidth = this.store.contentWidth - rowHeaderWidth
    this.store.cellsContentHeight = this.store.contentHeight - columnHeaderHeight
  }
}
