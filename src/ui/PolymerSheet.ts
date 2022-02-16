import './index.styl'

import { throttle } from 'throttle-debounce'

import store from './Store'

import Widgets from './widgets'

import { mergeOptions, d, isNullish } from '../utils'
import { PolymerSheetOptions, SheetId } from '../declare'

import type { Widget } from './widgets/Widget'
import type { Dom } from '../utils'
import type { Cell } from '../declare'

@observer
export class PolymerSheet {
  private readonly rootNodeId = 'polymersheet'
  private readonly viewNodeId = 'polymersheet__view'
  private readonly viewGridClassName = 'polymersheet__view_grid'

  containerNode!: Dom
  rootNode!: Dom
  viewNode!: Dom
  viewGridNodes!: Dom[]

  store = store

  widgets: Widget[] = []

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
    this.update = throttle(50, this.update.bind(this))
    this.renderSkeleton()
    this.calcContainerNodeSize()
    this.widgets.forEach(w => w.mount())
  }

  update() {
    this.widgets.forEach(w => w.update())
  }

  setWorksheet(sheetId: SheetId) {
    this.store.worksheetId = sheetId
    this.calcWorksheetSize()
  }

  getWorksheet() {
    return this.store.sheets.filter(sheet => sheet.id === this.store.worksheetId)[0]
  }

  private renderSkeleton() {
    this.containerNode = d(this.store.containerId)
    this.containerNode.append(`
			<div id="${this.rootNodeId}">
				<div id="${this.viewNodeId}">
					<table>
						<tr>
							<td class="${this.viewGridClassName}"></td>
							<td class="${this.viewGridClassName}"></td>
						</tr>
						<tr>
							<td class="${this.viewGridClassName}"></td>
							<td class="${this.viewGridClassName}"></td>
						</tr>
					</table>
				</div>
			</div>
		`)

    this.rootNode = this.containerNode.find(`#${this.rootNodeId}`)
    this.viewNode = this.containerNode.find(`#${this.viewNodeId}`)
    this.viewGridNodes = this.containerNode.findAll(`.${this.viewGridClassName}`)
  }

  calcWorksheetSize() {
    const sheet = this.getWorksheet()
    const rowLen = sheet.cells.length
    const columnLen = sheet.cells[0].length

    const horizontalLinesPosition: number[] = []
    const verticalLinesPosition: number[] = []
    let worksheetActualHeight = 0
    let worksheetActualWidth = 0

    for (let i = 0; i < rowLen; i++) {
      let rowHeight = this.store.defaultRowHeight

      if (sheet.rowsHidden?.includes(i)) {
        horizontalLinesPosition.push(worksheetActualHeight)
        continue
      }

      if (sheet.rowsHeightMap && !isNullish(sheet.rowsHeightMap[i])) {
        rowHeight = sheet.rowsHeightMap[i]
      }

      worksheetActualHeight += rowHeight
      horizontalLinesPosition.push(worksheetActualHeight)
    }

    for (let i = 0; i < columnLen; i++) {
      let columnWidth = this.store.defaultColWidth

      if (sheet.colsHidden && sheet.colsHidden.includes(i)) {
        verticalLinesPosition.push(worksheetActualWidth)
        continue
      }

      if (sheet.colsWidthMap && !isNullish(sheet.colsWidthMap[i])) {
        columnWidth = sheet.colsWidthMap[i]
      }

      worksheetActualWidth += columnWidth
      verticalLinesPosition.push(worksheetActualWidth)
    }

    this.store.horizontalLinesPosition = horizontalLinesPosition
    this.store.verticalLinesPosition = verticalLinesPosition
    this.store.worksheetActualHeight = worksheetActualHeight
    this.store.worksheetActualWidth = worksheetActualWidth
  }

  calcContainerNodeSize() {
    const {
      rowHeaderWidth,
      toolbarHeight,
      columnHeaderHeight,
      bottomBarHeight,
      scrollbarSize
    } = this.store

    this.store.containerNodeWidth = this.containerNode.width()
    this.store.containerNodeHeight = this.containerNode.height()
    this.store.contentWidth = this.store.containerNodeWidth - scrollbarSize
    this.store.contentHeight = this.store.containerNodeHeight - scrollbarSize - toolbarHeight - bottomBarHeight
    this.store.cellsContentWidth = this.store.contentWidth - rowHeaderWidth
    this.store.cellsContentHeight = this.store.contentHeight - columnHeaderHeight
  }

  /**
	 * 插入行
	 * @param start 要添加的首行的行号，从 0 开始
	 * @param len 行数
	 */
  insertRows(start: number, len = 1) {
    const worksheet = this.getWorksheet()
    const columnLen = worksheet.cells[0].length
    const newCells = Array.from({ length: len }).map(() => {
      return Array.from({ length: columnLen }).map(() => ({} as Cell))
    })

    worksheet.cells.splice(start, 0, ...newCells)
    this.calcWorksheetSize()
    this.update()
  }
}
