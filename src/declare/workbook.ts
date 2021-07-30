// boolean, number, error, string, empty
export type DataType = 'b' | 'n' | 'e' | 's' | 'e'


export interface Range {
  rs: number
  rd: number
  cs: number
  cd: number
}

export interface CellStyle {
  // font family
  ff: string

  // font size
  fs: number

  // font color
  fc: string

  // background color
  bc: string
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
}

export interface SheetId extends String {
  id: 'sheet'
}
export interface Sheet {
  id: SheetId

  cells: Cell[][]
  // styles: PolymerSheetLayoutStyle
  merges: []

  defaultRowHeight?: number

  defaultColWidth?: number

  rowsHeightMap?: Record<string, number>

  colsWidthMap?: Record<string, number>

  rowsHidden?: string[]

  colsHidden?: string[]

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