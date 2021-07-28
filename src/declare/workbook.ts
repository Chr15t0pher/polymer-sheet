// boolean, number, error, string, empty
export type DataType = 'b' | 'n' | 'e' | 's' | 'e'

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


export interface Worksheet {
  cells: Cell[][]
  // styles: PolymerSheetLayoutStyle
  merges: []
}

export interface PolymerSheetOptions {
  containerId: string
  sheets: Worksheet[]
  toolbarHeight?: number
}