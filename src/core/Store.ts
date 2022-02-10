import type { PolymerSheetOptions } from '../declare'

export interface Store extends PolymerSheetOptions {

  /** 画布css宽高 */
  contentWidth: number
  contentHeight: number

  devicePixelRatio: number

  /** 表格缩放*/
  zoomRatio: number

  /** 选中表格实际宽高 */
  worksheetActualWidth: number
  worksheetActualHeight: number

  /**选中表格垂直和水平表格线的实际位置 */
  horizontalLinesPosition: number[]
  verticalLinesPosition: number[]

  /** 文本换行溢出位置记录 */
  overflowMap: Map<number, { curCol: number, startCol: number, endCol: number }>
}

export const PLACEHOLDER_WORKSHEET_ID = -1

// store 中的宽高是内容 + border 的总宽高
const store: Store = {
  containerId: 'polymer_sheet',

  worksheetId: PLACEHOLDER_WORKSHEET_ID,

  sheets: [],

  toolbarHeight: 42,

  rowHeaderWidth: 40,
  columnHeaderHeight: 20,

  defaultRowHeight: 20,
  defaultColWidth: 74,

  scrollbarSize: 12,

  bottomBarHeight: 42,

  contentWidth: 0,
  contentHeight: 0,

  devicePixelRatio: 1,

  zoomRatio: 1,

  worksheetActualWidth: 0,
  worksheetActualHeight: 0,

  horizontalLinesPosition: [],
  verticalLinesPosition: [],

  overflowMap: new Map(),
}

export default store
