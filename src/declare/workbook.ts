// boolean, number, error, string, empty
export enum DataType {
  Boolean = 'b',
  Number = 'n',
  Error = 'e',
  String = 's',
  Empty = 'z'
}

export enum FontWeight {
  light = 'light',
  normal = 'normal',
  bold = 'bold',
  bolder = 'bolder'
}

export enum FontStyle {
  normal = 'normal',
  italic = 'italic',
  oblique = 'oblique'
}

export enum TextWrap {
  break = 'break', // 截断
  auto = 'auto', // 自动换行
  overflow = 'overflow' // 溢出
}

export enum TextAlign {
  start = 'start',
  end = 'end',
  center = 'center'
}

export enum TextBaseline {
  top = 'top',
  hanging = 'hanging',
  middle = 'middle',
  alphabetic = 'alphabetic',
  ideographic = 'ideographic',
  bottom = 'bottom'
}

export enum TextOrientation {
  normal = 'normal',
  up = 'up',
  down = 'down',
  vertical = 'vertical'
}

export interface MeasuredTextMetrics extends TextMetrics {
  height: number
}

export interface Range {
  cs: number
  rs: number
  cd: number
  rd: number
}

export interface CellStyle {
  /** foreground color */
  fg?: string
  /** background color */
  bg?: string

  /** font family */
  ff?: string
  /** font size */
  fs?: number
  /** font color */
  fc?: string
  /** text wrap */
  tw?: TextWrap
  /** text align */
  ta?: TextAlign
  /** text vertical align */
  tba?: TextBaseline
  /** text orientation */
  to?: TextOrientation
}

export interface Cell {
  /** raw value of the cell */
  v?: string | number | boolean | Date

  /** formatted text */
  w?: string

  /** data type */
  t?: DataType

  /** cell style */
  s?: CellStyle

  mc?: Range
}

export type SheetId = string | number | symbol

export interface Sheet {
  id: SheetId

  cells: Array<null | Cell>[]
  // styles: PolymerSheetLayoutStyle
  merges?: []

  rowsHeightMap?: Record<number, number>

  colsWidthMap?: Record<number, number>

  rowsHidden?: number[]

  colsHidden?: number[]

  scrollTop?: number

  scrollLeft?: number
}

export interface StyleSet {
  borderWidth?: number,
  borderColor?: string,
  backgroundColor?: string,
  fontSize?: number,
  fontColor?: string,
  fontFamily?: string,
}

/**
 * 不同状态下的样式
 * `default`: 默认样式
 * `highlight`: 高亮样式
 * `focus`: 选中时，表头和单元格的样式，选中表头时，所在行或列单元格高亮；选中单个单元格时，所在行和列表头高亮
 */
export interface StylesOfDifferentStatus {
  default?: StyleSet,
  highlight?: StyleSet,
  focus?: StyleSet
}

export interface PolymerSheetOptions {
  containerId: string

  sheets: Sheet[]

  /** default current worksheet id */
  worksheetId: SheetId

  toolbarHeight: number

  rowHeaderWidth: number
  columnHeaderHeight: number

  defaultRowHeight: number
  defaultColWidth: number

  bottomBarHeight: number

  styles: {
    backgroundColor?: string,
    upperLeftCorner?: StyleSet,
    header?: StylesOfDifferentStatus,
    cell?: StylesOfDifferentStatus,
  }
}
