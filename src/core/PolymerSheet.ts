import store from './Store'
import Content from './Content'
import ToolBar from './ToolBar'
import BottomBar from './BottomBar'
import ScrollBar from './ScrollBar'
import { mergeOptions, d, isNullish } from '../utils'
import { PolymerSheetOptions, Sheet, SheetId } from '../declare'
import './index.styl'

export class PolymerSheet {
  store = store

  toolbar!: ToolBar

  content!: Content

  bottomBar!: BottomBar

  scrollBar!: ScrollBar

  constructor(options: Partial<PolymerSheetOptions>) {
    this.store = mergeOptions(this.store, options)
    this.toolbar = new ToolBar(this)
    this.content = new Content(this)
    this.bottomBar = new BottomBar(this)
    this.scrollBar = new ScrollBar(this)


    const { sheets, worksheetId } = this.store

    if (sheets.length > 0) {
      const defaultWorksheetId = sheets.some((sheet) => sheet.id === worksheetId)
        ? worksheetId
        : sheets[0].id
      this.setWorksheet(defaultWorksheetId)
    }

  }

  mount() {
    this.toolbar.mount()
    this.bottomBar.mount()
    this.renderSkeleton()
    this.content.mount()
    this.scrollBar.mount()
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
      devicePixelRatio,
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

    const cellsContentWidth = cellsOverlayWidth - scrollbarSize
    const cellsContentHeight = cellsOverlayHeight - scrollbarSize

    this.store.contentWidth = containerWidth - scrollbarSize
    this.store.contentHeight = containerHeight - (scrollbarSize + toolbarHeight + bottomBarHeight)

    container.append(`
      <div id="polymersheet" style="width: ${containerWidth}px; height: ${containerHeight}px">
        <div id="polymersheet__toolbar" style="height: ${toolbarHeight}px">
        </div>
        <div id="polymersheet__view">
          <canvas id="polymersheet__content" width="${this.store.contentWidth * devicePixelRatio}" height="${this.store.contentHeight * devicePixelRatio}" style="width: ${this.store.contentWidth}px; height: ${this.store.contentHeight}px"></canvas>
          <table>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__upper_left_corner" style="width: ${rowHeaderWidth}px; height: ${columnHeaderHeight}px;"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__header--col" style="width: ${cellsContentWidth}px; height: ${columnHeaderHeight}px; "></div>
								<div class="polymersheet__header_shim--col" style="width: ${scrollbarSize}px; height: ${columnHeaderHeight}px"></div>
              </td>
            </tr>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__header--row" style="width: ${rowHeaderWidth}px; height: ${cellsContentHeight}px"></div>
								<div class="polymersheet__header_shim--row" style="width: ${rowHeaderWidth}px; height: ${scrollbarSize}px"></div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__scrollbar polymersheet__scrollbar--vertical" style="width: ${scrollbarSize}px; height: ${cellsContentHeight}px;">
                  <div style="height: ${this.store.worksheetActualHeight}px"></div>
                </div>
                <div class="polymersheet__scrollbar polymersheet__scrollbar--horizontal" style="width: ${cellsOverlayWidth}px; height: ${scrollbarSize}px;">
                  <div style="width: ${this.store.worksheetActualWidth}px;"></div>
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
}
