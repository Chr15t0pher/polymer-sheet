import { action, computed, observable } from '../state'
import type { PolymerSheetOptions, Sheet, SheetId } from '../declare'
import { isNullish } from '../utils'

export type OverflowMap = Map<number, Map<number, { row: number, intervalLeftCol: number, intervalRightCol: number }>>

/**
 * Store 中所涉及的宽高均为「内容 + 边框」的总宽高
 */
export interface Store extends PolymerSheetOptions {

  /** 根节点宽度 */
  containerNodeWidth: number
  /** 根节点高度 */
  containerNodeHeight: number

  /** 画布宽度 */
  contentWidth: number
  /** 画布高度 */
  contentHeight: number

  /** 表格内容（单元格）部分的宽度 */
  cellsContentWidth: number
  /** 表格内容（单元格）部分的高度 */
  cellsContentHeight: number

  /** 画布右边距 */
  contentPaddingRight: number
  /** 画布底部边距 */
  contentPaddingBottom: number

  /** 设备像素比 */
  devicePixelRatio: number

  /** 表格缩放比例 */
  zoomRatio: number

  /** 当前表格的实际宽度 */
  worksheetActualWidth: number
  /** 当前表格的实际高度 */
  worksheetActualHeight: number

  /** 当前表格内容水平表格线的实际位置 */
  horizontalLinesPosition: number[]
  /** 当前表格内容垂直表格线的实际位置 */
  verticalLinesPosition: number[]

  /** 文本换行溢出位置记录 */
  overflowMap: OverflowMap,

  /** 滚动条宽度 */
  scrollbarSize: number,
}

export const PLACEHOLDER_WORKSHEET_ID = -1

const store: Store = {
  containerId: 'polymer_sheet',

  worksheetId: PLACEHOLDER_WORKSHEET_ID,

  sheets: [],

  toolbarHeight: 42,

  rowHeaderWidth: 46,
  columnHeaderHeight: 24,

  defaultRowHeight: 20,
  defaultColWidth: 100,

  bottomBarHeight: 42,

  containerNodeWidth: 0,
  containerNodeHeight: 0,

  contentWidth: 0,
  contentHeight: 0,

  cellsContentWidth: 0,
  cellsContentHeight: 0,

  contentPaddingRight: 20,
  contentPaddingBottom: 50,

  devicePixelRatio: window.devicePixelRatio,

  zoomRatio: 1,

  worksheetActualWidth: 0,
  worksheetActualHeight: 0,

  overflowMap: new Map(),

  scrollbarSize: 12,
}

export const defaultPolymerSheetOptions: PolymerSheetOptions = {
  containerId: 'polymer_sheet',

  sheets: [],

  /** default current worksheet id */
  worksheetId: PLACEHOLDER_WORKSHEET_ID,

  toolbarHeight: 42,

  rowHeaderWidth:  46,
  columnHeaderHeight: 24,

  defaultRowHeight: 20,
  defaultColWidth: 100,

  bottomBarHeight: 42,

  styles: {
    backgroundColor: '#f5f5f5',
    upperLeftCorner: {
      borderWidth: 5,
      borderColor: '#c0c0c0',
      backgroundColor: '#ffffff'
    },
    cell: {
      default: {
        borderWidth: 1,
        borderColor: '#dcdcdc',
        backgroundColor: '#ffffff',
      },
      highlight: {
        borderWidth: 1,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
      },
      focus: {
        borderWidth: 2,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
      }
    },
    header: {
      default: {
        borderWidth: 1,
        borderColor: '#c0c0c0',
        backgroundColor: '#f8f9fa',
        fontSize: 11,
        fontColor: '#555555'
      },
      highlight: {
        borderWidth: 1,
        borderColor: 'blue',
        backgroundColor: 'lightblue',
      },
      focus: {
        borderWidth: 1,
        backgroundColor: 'gray',
        fontColor: 'white'
      }
    }
  }
}

export class PolymerSheetStore {
  containerId: string

  /** 根节点宽度 */
  @observable
  containerNodeWidth = 0

  /** 根节点高度 */
  @observable
  containerNodeHeight = 0

  @observable
  worksheetId: SheetId

  @observable
  sheets: Sheet[]

  toolbarHeight: number

  rowHeaderWidth: number

  columnHeaderHeight: number

  defaultColWidth: number

  defaultRowHeight: number

  bottomBarHeight: number

  @observable
  horizontalLinesPosition: number[] = []

  @observable
  verticalLinesPosition: number[] = []

  @observable
  worksheetActualWidth = 0

  @observable
  worksheetActualHeight = 0

  @observable
  devicePixelRatio = window.devicePixelRatio

  scrollbarSize = 12

  overflowMap = new Map()

  styles: PolymerSheetOptions['styles']

  contentPaddingRight = 20
  contentPaddingBottom = 50

  constructor(options: PolymerSheetOptions) {
    const {
      containerId,
      sheets,
      worksheetId,
      toolbarHeight,
      rowHeaderWidth,
      columnHeaderHeight,
      defaultColWidth,
      defaultRowHeight,
      bottomBarHeight,
      styles
    } = options
    this.containerId = containerId
    this.sheets = sheets
    this.worksheetId = worksheetId
    this.toolbarHeight = toolbarHeight
    this.rowHeaderWidth = rowHeaderWidth
    this.columnHeaderHeight = columnHeaderHeight
    this.defaultColWidth = defaultColWidth
    this.defaultRowHeight = defaultRowHeight
    this.bottomBarHeight = bottomBarHeight
    this.styles = styles

    if (this.sheets.length > 0) {
      const defaultWorksheetId = this.sheets.some((sheet) => sheet.id === this.worksheetId)
        ? this.worksheetId
        : sheets[0].id
      this.setWorksheet(defaultWorksheetId)
    }
  }

  @computed
  get contentWidth() {
    return this.containerNodeWidth - this.scrollbarSize
  }

  @computed
  get contentHeight() {
    return this.containerNodeHeight - this.scrollbarSize - this.toolbarHeight - this.bottomBarHeight
  }

  @computed
  get cellsContentWidth() {
    return this.contentWidth - this.rowHeaderWidth
  }

  @computed
  get cellsContentHeight() {
    return this.contentHeight - this.columnHeaderHeight
  }

  @computed
  get worksheet() {
    return this.sheets.filter(sheet => sheet.id === this.worksheetId)[0] || this.sheets[0]
  }

  @action
  setWorksheet(sheetId: SheetId) {
    this.worksheetId = sheetId
    if (this.worksheet) {
      this.calcWorksheetSize()
    }
  }

  @action
  calcWorksheetSize() {
    const { worksheet } = this
    const rowLen = worksheet.cells.length
    const columnLen = worksheet.cells[0].length

    const horizontalLinesPosition: number[] = []
    const verticalLinesPosition: number[] = []
    let worksheetActualHeight = 0
    let worksheetActualWidth = 0

    for (let i = 0; i < rowLen; i++) {
      let rowHeight = this.defaultRowHeight

      if (worksheet.rowsHidden?.includes(i)) {
        horizontalLinesPosition.push(worksheetActualHeight)
        continue
      }

      if (worksheet.rowsHeightMap && !isNullish(worksheet.rowsHeightMap[i])) {
        rowHeight = worksheet.rowsHeightMap[i]
      }

      worksheetActualHeight += rowHeight
      horizontalLinesPosition.push(worksheetActualHeight)
    }

    for (let i = 0; i < columnLen; i++) {
      let columnWidth = this.defaultColWidth

      if (worksheet.colsHidden && worksheet.colsHidden.includes(i)) {
        verticalLinesPosition.push(worksheetActualWidth)
        continue
      }

      if (worksheet.colsWidthMap && !isNullish(worksheet.colsWidthMap[i])) {
        columnWidth = worksheet.colsWidthMap[i]
      }

      worksheetActualWidth += columnWidth
      verticalLinesPosition.push(worksheetActualWidth)
    }

    this.horizontalLinesPosition = horizontalLinesPosition
    this.verticalLinesPosition = verticalLinesPosition
    this.worksheetActualHeight = worksheetActualHeight
    this.worksheetActualWidth = worksheetActualWidth
  }
}
export default store
