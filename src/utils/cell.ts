import { Cell } from '../declare'

/**
 * find a cell at a particular position
 * @param positions An array of the right/bottom border of all cells
 * @param anchor the given position
 * @returns cell index
 */
export function findCellPosition(positions: number[], anchor: number) {
  let st = 0
  let ed = positions.length - 1

  while(st <= ed) {
    const mid = Math.floor((st + ed) / 2)

    if (anchor < positions[mid] && (mid === 0 || positions[mid - 1] < anchor)) {
      return mid
    } else if (positions[mid] <= anchor) {
      st = mid + 1
    } else if (anchor < positions[mid]) {
      ed = mid - 1
    } else {
      return -1
    }
  }
  return -1
}

export function getCellDisplayValue(cell: Cell) {
  //
}
