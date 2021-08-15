import type { PolymerSheetOptions } from '../declare'

export interface Store extends PolymerSheetOptions {
  contentWidth: number
  contentHeight: number

  devicePixelRatio: number

  zoomRatio: number

  defaultRowHeight: number
  defaultColWidth: number

  worksheetActualWidth: number
  worksheetActualHeight: number

  horizontalLinesPosition: number[]
  verticalLinesPosition: number[]

  overflowMap: Map<number, { curCol: number, startCol: number, endCol: number }>
}

// store 中的宽高是内容 + border 的总宽高
const store: Store = {
  containerId: 'polymer_sheet',

  sheets: [],

  toolbarHeight: 42,

  rowHeaderWidth: 40,
  columnHeaderHeight: 20,

  scrollbarSize: 12,

  bottomBarHeight: 42,

  // 画布css宽高
  contentWidth: 0,
  contentHeight: 0,

  devicePixelRatio: 1,

  // 表格缩放
  zoomRatio: 1,

  // 默认 cell 宽高
  defaultRowHeight: 20,
  defaultColWidth: 74,

  // 选中表格实际宽高
  worksheetActualWidth: 0,
  worksheetActualHeight: 0,

  // 选中表格垂直和水平表格线的实际位置
  horizontalLinesPosition: [],
  verticalLinesPosition: [],

  // 文本换行溢出位置记录
  overflowMap: new Map(),
}

export default store
