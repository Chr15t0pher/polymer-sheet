import store from './Store'
import Content from './Content'
import ToolBar from './ToolBar'
import BottomBar from './BottomBar'
import { merge, d } from '../utils'
import { PolymerSheetOptions, Sheet, SheetId } from '../declare'
import './index.styl'

export class PolymerSheet {
  store = store

  toolbar!: ToolBar

  content!: Content

  bottomBar!: BottomBar

  constructor(options: PolymerSheetOptions) {
    this.store = merge(this.store, options)
    this.toolbar = new ToolBar(this)
    this.content = new Content(this)
    this.bottomBar = new BottomBar()

    if (this.store.sheets.length > 0) {
      this.setWorksheet(this.store.worksheetId || this.store.sheets[0].id)
    }
  }

  render() {
    this.toolbar.mount()
    this.bottomBar.mount()
    this.renderSkeleton()
    this.content.mount()
    this.content.draw()
  }

  setWorksheet(sheetId: SheetId) {
    this.store.worksheetId = sheetId
    const worksheet = this.getWorksheet()
    this.setWorksheetActualSize(worksheet)
  }

  getWorksheet() {
    if (this.store.worksheetId) {
      for (let i = 0; i < this.store.sheets.length; i++) {
        if (this.store.worksheetId === this.store.sheets[i].id) {
          return this.store.sheets[i]
        }
      }
    }
    return this.store.sheets[0]
  }

  renderSkeleton() {
    const container = d(this.store.containerId)
    const ContainerHeight = container.height()
    const ContainerWidth = container.width()

    const cellsOverlayWidth = ContainerWidth - this.store.rowHeaderWidth!
    const cellsOverlayHeight = ContainerHeight - (this.store.toolbarHeight! + this.store.columnHeaderHeight! + this.store.bottomBarHeight!)

    const verticalScrollbarHeight = cellsOverlayHeight + this.store.columnHeaderHeight! - this.store.scrollbarSize!
    const horizontalScrollbarWidth = cellsOverlayWidth

    this.store.contentWidth = ContainerWidth - this.store.scrollbarSize!
    this.store.contentHeight = ContainerHeight - (this.store.scrollbarSize! + this.store.toolbarHeight! + this.store.bottomBarHeight!)

    container.append (`
      <div id="polymersheet" style="width: ${ContainerWidth}px; height: ${ContainerHeight}px">
        <div id="polymersheet__toolbar" style="height: ${this.store.toolbarHeight}px">
        </div>
        <div id="polymersheet__view">
          <canvas id="polymersheet__content" width="${this.store.contentWidth * this.store.devicePixelRatio}" height="${this.store.contentHeight * this.store.devicePixelRatio}" style="width: ${this.store.contentWidth}px; height: ${this.store.contentHeight}px"></canvas>
          <table>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__upper_left_corner" style="width: ${this.store.rowHeaderWidth}px; height: ${this.store.columnHeaderHeight}px;"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__col_header" style="width: ${cellsOverlayWidth}px; height: ${this.store.columnHeaderHeight}px; "></div>
              </td>
            </tr>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__column_header" style="width: ${this.store.rowHeaderWidth}px; height: ${cellsOverlayHeight}px"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__scrollbar polymersheet__scrollbar-vertical" style="width: ${this.store.scrollbarSize}px; height: ${verticalScrollbarHeight}px; right: 0px; top: 0px;">
                  <div style="height: ${this.store.worksheetActualHeight}px"></div>
                </div>
                <div class="polymersheet__scrollbar polymersheet__scrollbar-horizontal" style="width: ${horizontalScrollbarWidth}px; height: ${this.store.scrollbarSize}px; right: 0px; bottom: 0px;">
                  <div style="width: ${this.store.worksheetActualWidth}px"></div>
                </div>
                <div class="polymersheet__cells_overlay" style="width: ${cellsOverlayWidth}px; height: ${cellsOverlayHeight}px"></div>
              </td>
            </tr>
          </table>
        </div>
        <div id="polymersheet__bottombar">
          bottombar
        </div>
      </div>
    `)

  }

  private setWorksheetActualSize(sheet: Sheet) {
    const rowLen = sheet.cells.length
    const columnLen = sheet.cells[0].length
    for (let i = 0; i < rowLen; i++) {
      let rowHeight = this.store.defaultRowHeight

      if (sheet.rowsHeightMap && sheet.rowsHeightMap[i] !== null) {
        rowHeight = sheet.rowsHeightMap[i]
      } else if (sheet.rowsHidden && sheet.rowsHidden.includes(i)) {
        this.store.horizontalLinesPosition.push(this.store.worksheetActualHeight)
        continue
      }
      this.store.worksheetActualHeight += Math.round(rowHeight)
      this.store.horizontalLinesPosition.push(this.store.worksheetActualHeight)
    }

    for (let i = 0; i < columnLen; i++) {
      let columnWidth = this.store.defaultColWidth

      if (sheet.colsWidthMap && sheet.colsWidthMap[i] !== null) {
        columnWidth = sheet.colsWidthMap[i]
      } else if (sheet.colsHidden && sheet.colsHidden.includes(i)) {
        this.store.verticalLinesPosition.push(this.store.worksheetActualWidth)
        continue
      }
      this.store.worksheetActualWidth += Math.round(columnWidth)
      this.store.verticalLinesPosition.push(this.store.worksheetActualWidth)
    }
  }
}
