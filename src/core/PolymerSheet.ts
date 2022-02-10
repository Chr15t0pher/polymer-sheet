import store from './Store'
import Content from './Content'
import ToolBar from './ToolBar'
import BottomBar from './BottomBar'
import { mergeOptions, d, isNullish } from '../utils'
import { PolymerSheetOptions, Sheet, SheetId } from '../declare'
import './index.styl'

export class PolymerSheet {
  store = store

  toolbar!: ToolBar

  content!: Content

  bottomBar!: BottomBar

  constructor(options: Partial<PolymerSheetOptions>) {
    this.store = mergeOptions(this.store, options)
    this.toolbar = new ToolBar(this)
    this.content = new Content(this)
    this.bottomBar = new BottomBar()

    const { sheets, worksheetId } = this.store

    if (sheets.length > 0) {
      const defaultWorksheetId = sheets.some((sheet) => sheet.id === worksheetId)
        ? worksheetId
        : sheets[0].id
      this.setWorksheet(defaultWorksheetId)
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
    if (worksheet) {
      this.setWorksheetActualSize(worksheet)
    }
  }

  getWorksheet() {
    return this.store.sheets.filter(sheet => sheet.id === this.store.worksheetId)[0]
  }

  renderSkeleton() {
    const {
      containerId,
      rowHeaderWidth,
      toolbarHeight,
      columnHeaderHeight,
      bottomBarHeight,
      scrollbarSize
    } = this.store

    const container = d(containerId)
    const containerHeight = container.height()
    const containerWidth = container.width()

    const cellsOverlayWidth = containerWidth - rowHeaderWidth
    const cellsOverlayHeight = containerHeight - (toolbarHeight + columnHeaderHeight + bottomBarHeight)

    const verticalScrollbarHeight = cellsOverlayHeight + columnHeaderHeight - scrollbarSize
    const horizontalScrollbarWidth = cellsOverlayWidth

    this.store.contentWidth = containerWidth - scrollbarSize
    this.store.contentHeight = containerHeight - (scrollbarSize + toolbarHeight + bottomBarHeight)

    container.append (`
      <div id="polymersheet" style="width: ${containerWidth}px; height: ${containerHeight}px">
        <div id="polymersheet__toolbar" style="height: ${toolbarHeight}px">
        </div>
        <div id="polymersheet__view">
          <canvas id="polymersheet__content" width="${this.store.contentWidth * this.store.devicePixelRatio}" height="${this.store.contentHeight * this.store.devicePixelRatio}" style="width: ${this.store.contentWidth}px; height: ${this.store.contentHeight}px"></canvas>
          <table>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__upper_left_corner" style="width: ${rowHeaderWidth}px; height: ${columnHeaderHeight}px;"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__col_header" style="width: ${cellsOverlayWidth}px; height: ${columnHeaderHeight}px; "></div>
              </td>
            </tr>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__column_header" style="width: ${rowHeaderWidth}px; height: ${cellsOverlayHeight}px"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__scrollbar polymersheet__scrollbar-vertical" style="width: ${scrollbarSize}px; height: ${verticalScrollbarHeight}px; right: 0px; top: 0px;">
                  <div style="height: ${this.store.worksheetActualHeight}px"></div>
                </div>
                <div class="polymersheet__scrollbar polymersheet__scrollbar-horizontal" style="width: ${horizontalScrollbarWidth}px; height: ${scrollbarSize}px; right: 0px; bottom: 0px;">
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

      if (sheet.rowsHeightMap && !isNullish(sheet.rowsHeightMap[i])) {
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
