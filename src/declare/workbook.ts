// boolean, number, error, string, empty
export enum DataType {
  Boolean = 'b',
  Number = 'n',
  Error = 'e',
  String = 's',
  Empty = 'z'
}

export enum TextWrap {
  break = 'break', // 截断
  auto = 'auto',   // 自动换行
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
  // foreground color
  fg?: string
  // background color
  bg?: string

  // font family
  ff?: string
  // font size
  fs?: number
  // font color
  fc?: string
  // text wrap
  tw?: TextWrap
  // text align
  ta?: TextAlign
  // text vertical align
  tba?: TextBaseline
  // text orientation
  to?: TextOrientation
}

export interface Cell {
  // raw value of the cell
  v?: string | number | boolean | Date

  // formatted text
  w?: string

  // data type
  t: DataType

  // cell style
  s?: CellStyle

  mc?: Range
}

export interface SheetId extends String {
  id: 'sheet'
}
export interface Sheet {
  id: SheetId

  cells: Array<null | Cell>[]
  // styles: PolymerSheetLayoutStyle
  merges: []

  defaultRowHeight?: number

  defaultColWidth?: number

  rowsHeightMap?: Record<string, number>

  colsWidthMap?: Record<string, number>

  rowsHidden?: number[]

  colsHidden?: number[]

  scrollTop?: number

  scrollLeft?: number
}

export interface PolymerSheetOptions {
  containerId: string

  sheets: Sheet[]

  toolbarHeight?: number

  rowHeaderWidth?: number
  columnHeaderHeight?: number

  scrollbarSize?: number

  bottomBarHeight?: number

  worksheetId?: SheetId
}