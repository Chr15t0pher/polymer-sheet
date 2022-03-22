import type { PolymerSheetOptions } from '../declare'

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

  horizontalLinesPosition: [],
  verticalLinesPosition: [],

  overflowMap: new Map(),

  scrollbarSize: 12,

  styles: {
    backgroundColor: '#f5f5f5',
    upperLeftCorner: {
      borderWidth: 1,
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

export default store
