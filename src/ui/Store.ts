import { action, computed, observable } from '../state'
import type { PolymerSheetOptions, Sheet, SheetId, Cell } from '../declare'
import { isNullish } from '../utils'

export type OverflowMap = Map<number, Map<number, { row: number, intervalLeftCol: number, intervalRightCol: number }>>

export const PLACEHOLDER_WORKSHEET_ID = -1

/**
 * Store 中所涉及的宽高均为「内容 + 边框」的总宽高
 */
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
  sheets: Sheet[]

  toolbarHeight: number

  rowHeaderWidth: number

  columnHeaderHeight: number

  defaultColWidth: number

  defaultRowHeight: number

  bottomBarHeight: number

  /** 当前表格内容水平表格线的实际位置 */
  @observable
  horizontalLinesPosition: number[] = []

  /** 当前表格内容垂直表格线的实际位置 */
  @observable
  verticalLinesPosition: number[] = []

  /** 当前表格的实际宽度 */
  @observable
  worksheetActualWidth = 0

  /** 当前表格的实际高度 */
  @observable
  worksheetActualHeight = 0

  /** 设备像素比 */
  @observable
  devicePixelRatio = window.devicePixelRatio

  /** 滚动条宽度 */
  scrollbarSize = 12

  /** 文本换行溢出位置记录 */
  overflowMap = new Map()

  styles: PolymerSheetOptions['styles']

  /** 画布右边距 */
  contentPaddingRight = 20

  /** 画布底部边距 */
  contentPaddingBottom = 50

  @observable
  worksheet!: Sheet

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
    this.toolbarHeight = toolbarHeight
    this.rowHeaderWidth = rowHeaderWidth
    this.columnHeaderHeight = columnHeaderHeight
    this.defaultColWidth = defaultColWidth
    this.defaultRowHeight = defaultRowHeight
    this.bottomBarHeight = bottomBarHeight
    this.styles = styles

    if (this.sheets.length > 0) {
      const defaultWorksheetId = this.sheets.some((sheet) => sheet.id === worksheetId)
        ? worksheetId
        : sheets[0].id
      this.setWorksheet(defaultWorksheetId)
      if (this.worksheet) {
        this.calcWorksheetSize()
      }
    }
  }

  /** 画布宽度 */
  @computed
  get contentWidth() {
    return this.containerNodeWidth - this.scrollbarSize
  }

  /** 画布高度 */
  @computed
  get contentHeight() {
    return this.containerNodeHeight - this.scrollbarSize - this.toolbarHeight - this.bottomBarHeight
  }

  /** 表格内容（单元格）部分的宽度 */
  @computed
  get cellsContentWidth() {
    return this.contentWidth - this.rowHeaderWidth
  }

  /** 表格内容（单元格）部分的高度 */
  @computed
  get cellsContentHeight() {
    return this.contentHeight - this.columnHeaderHeight
  }

  @action
  setWorksheet = (sheetId: SheetId) => {
    this.worksheet = this.sheets.filter(sheet => sheet.id === sheetId)[0] || this.sheets[0]
  }

  @action
  insertRowsIntoWorksheet = (start: number, newRows: Cell[][]) => {
    this.worksheet.cells.splice(start, 0, ...newRows)
  }

  @action
  setWorksheetScrollInfo = (scrollTop: number, scrollLeft: number) => {
    this.worksheet.scrollTop = scrollTop
    this.worksheet.scrollLeft = scrollLeft
  }

  @action
  calcWorksheetSize = () => {
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

  @action
  calcContainerNodeSize = (width: number, height: number) => {
    this.containerNodeWidth = width
    this.containerNodeHeight = height
  }
}
