import type { PolymerSheet } from './PolymerSheet'
import { Sheet, DataType, TextWrap, TextAlign } from '../declare'
import { d, position_binary_search, transNumToColumnIdx, isNullish, getCellTextInfo } from '../utils'

export default class Content {
  containerId = '#polymersheet__view'

  ctx!: CanvasRenderingContext2D

  constructor(private polymersheet: PolymerSheet) {}

  mount() {
    const ctx = (d(`${this.containerId} #polymersheet__content`).elem() as HTMLCanvasElement).getContext('2d')
    if (!ctx) {
      throw new Error('fail to get canvas 2D context')
    } else {
      this.ctx = ctx
    }
  }

  draw() {
    const worksheet = this.polymersheet.getWorksheet()
    const { scrollLeft, scrollTop } = worksheet

    this.drawUpperLeftCorner()
    this.drawRowHeader(worksheet, scrollTop)
    this.drawColumnHeader(worksheet, scrollLeft)
    this.drawContent(worksheet, scrollLeft, scrollTop)
  }

  drawUpperLeftCorner() {
    const { columnHeaderHeight, rowHeaderWidth } = this.polymersheet.store
    this.ctx.save()
    this.ctx.strokeStyle = '#dfdfdf'
    this.ctx.lineWidth = 1

    this.ctx.beginPath()
    this.ctx.moveTo(0, columnHeaderHeight! - 0.5)
    this.ctx.lineTo(rowHeaderWidth! - 0.5, columnHeaderHeight! - 0.5)
    this.ctx.lineTo(rowHeaderWidth! - 0.5, 0)
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawRowHeader(worksheet: Sheet, scrollTop = 0) {
    const offsetTop = this.polymersheet.store.columnHeaderHeight!
    const contentHeight = this.polymersheet.store.contentHeight!
    const horizontalLinesPosition = this.polymersheet.store.horizontalLinesPosition
    const rowHeaderWidth = this.polymersheet.store.rowHeaderWidth!

    let startRow = position_binary_search(horizontalLinesPosition, scrollTop)
    let endRow = position_binary_search(horizontalLinesPosition, scrollTop + contentHeight)

    if (startRow === -1) {
      startRow = 0
    }

    if (endRow === -1) {
      endRow = horizontalLinesPosition.length - 1
    }

    this.ctx.clearRect(0, offsetTop, rowHeaderWidth, contentHeight - offsetTop)
    this.ctx.save()
    this.ctx.translate(0, offsetTop)
    this.ctx.strokeStyle = '#dfdfdf'
    this.ctx.lineWidth = 1

    for (let i = startRow; i <= endRow; i++) {
      if (worksheet.rowsHidden && worksheet.rowsHidden.includes(i)) {
        continue
      }

      const preCurrentRowEndAxisY = i === 0 ? -scrollTop : horizontalLinesPosition[i - 1] - scrollTop
      const currentRowEndAxisY = horizontalLinesPosition[i] - scrollTop
      
      // vertical lines
      this.ctx.beginPath()
      this.ctx.moveTo(rowHeaderWidth - 0.5, preCurrentRowEndAxisY - 1)
      this.ctx.lineTo(rowHeaderWidth - 0.5, currentRowEndAxisY - 1)
      this.ctx.closePath()
      this.ctx.stroke()
      
      // horizontal lines
      this.ctx.beginPath()
      this.ctx.moveTo(0, currentRowEndAxisY)
      this.ctx.lineTo(rowHeaderWidth, currentRowEndAxisY - 0.5)
      this.ctx.closePath()
      this.ctx.stroke()
      
      // content
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      const textHorizontalPos = Math.round(rowHeaderWidth / 2)
      const textVerticalPos = Math.round((currentRowEndAxisY + preCurrentRowEndAxisY) / 2)

      this.ctx.fillText(`${i + 1}`, textHorizontalPos, textVerticalPos)
    }
    this.ctx.restore()
  }

  drawColumnHeader(worksheet: Sheet, scrollLeft = 0) {
    const offsetLeft = this.polymersheet.store.rowHeaderWidth!
    const contentWidth = this.polymersheet.store.contentWidth
    const verticalLinesPosition = this.polymersheet.store.verticalLinesPosition
    const columnHeaderHeight = this.polymersheet.store.columnHeaderHeight!

    let startCol = position_binary_search(verticalLinesPosition, scrollLeft)
    let endCol = position_binary_search(verticalLinesPosition, scrollLeft + contentWidth)

    if (startCol === -1) {
      startCol = 0
    }
    if (endCol === -1) {
      endCol = verticalLinesPosition.length - 1
    }

    this.ctx.clearRect(offsetLeft, 0, contentWidth - offsetLeft, columnHeaderHeight)
    this.ctx.save()
    this.ctx.translate(offsetLeft, 0)
    this.ctx.strokeStyle = '#dfdfdf'
    this.ctx.lineWidth = 1
  
    for (let i = startCol; i <= endCol; i++) {
      if (worksheet.colsHidden && worksheet.colsHidden.includes(i)) {
        continue
      }

      const preCurrentColEndAxisX = i === 0 ? -scrollLeft : verticalLinesPosition[i - 1] - scrollLeft
      const currentColEndAxisX = verticalLinesPosition[i] - scrollLeft

      // vertical lines
      this.ctx.beginPath()
      this.ctx.moveTo(currentColEndAxisX - 0.5, 0)
      this.ctx.lineTo(currentColEndAxisX - 0.5, columnHeaderHeight - 1)
      this.ctx.closePath()
      this.ctx.stroke()

      // horizontal lines
      this.ctx.beginPath()     
      this.ctx.moveTo(preCurrentColEndAxisX, columnHeaderHeight - 0.5)
      this.ctx.lineTo(currentColEndAxisX, columnHeaderHeight - 0.5)
      this.ctx.closePath()
      this.ctx.stroke()

      // content
      const columnNum = transNumToColumnIdx(i)
      const textHorizontalPos = Math.round((preCurrentColEndAxisX + currentColEndAxisX) / 2)
      const textVerticalPos = Math.round(columnHeaderHeight / 2)

      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(columnNum, textHorizontalPos, textVerticalPos)
    }
    this.ctx.restore()
  }

  drawContent(worksheet: Sheet, scrollTop = 0, scrollLeft = 0) {
    const offsetLeft = this.polymersheet.store.rowHeaderWidth!
    const offsetTop = this.polymersheet.store.columnHeaderHeight!
    const contentWidth = this.polymersheet.store.contentWidth
    const contentHeight = this.polymersheet.store.contentHeight
    const { verticalLinesPosition, horizontalLinesPosition, defaultColWidth } = this.polymersheet.store

    let startRow = position_binary_search(horizontalLinesPosition, scrollTop)
    let endRow = position_binary_search(horizontalLinesPosition, scrollTop + contentHeight)
    let startCol = position_binary_search(verticalLinesPosition, scrollLeft)
    let endCol = position_binary_search(verticalLinesPosition, scrollLeft + contentWidth)

    if (startRow === -1) {
      startRow = 0
    }

    if (endRow === -1) {
      endRow = horizontalLinesPosition.length - 1
    }

    if (startCol === -1) {
      startCol = 0
    }

    if (endCol === -1) {
      endCol = verticalLinesPosition.length - 1
    }

    this.ctx.clearRect(offsetLeft, offsetTop, contentWidth, contentHeight)
    this.ctx.save()

    this.ctx.translate(offsetLeft, offsetTop)

    const cellsUpdate: any = []
    const mergeCache: any = {}
    const borderOffset: any = {}
  
    for (let r = startRow; r <= endRow; r++) {
      if (worksheet.rowsHidden && worksheet.rowsHidden.includes(r)) {
        continue
      }

      const startAxisY = r === 0 ? -scrollTop : horizontalLinesPosition[r - 1] - scrollTop
      const endAxisY = horizontalLinesPosition[r] - scrollTop

      for (let c = startCol; c <= endCol; c++) {
        if (worksheet.colsHidden && worksheet.colsHidden.includes(c)) {
          continue
        }

        const startAxisX = c === 0 ? -scrollLeft : verticalLinesPosition[c - 1] - scrollLeft
        const endAxisX = verticalLinesPosition[c] - scrollLeft

        const columnWidth = worksheet.colsWidthMap && worksheet.colsWidthMap[c] ? worksheet.colsWidthMap[c] : defaultColWidth

        borderOffset[r + '_' + c] = {
          sx: startAxisX,
          sy: startAxisY,
          ex: endAxisX,
          ey: endAxisY,
        }

        if (worksheet.cells[r][c] !== null) {
          const value = worksheet.cells[r][c]

          if (value !== null && 'mc' in value) {
            if (value.t !== DataType.Empty) {
              mergeCache[r + '_' + c] = cellsUpdate.length
            } else {
              const key = value.mc?.rs + '_' + value.mc?.cs
              const mergeMain = cellsUpdate[mergeCache[key]]
              
              if (c === mergeMain.c) {
                mergeMain.ey += endAxisY - startAxisY
              }

              if (r === mergeMain.r) {
                mergeMain.ex += endAxisX - startAxisX
                mergeMain.columnWidth += columnWidth
              }
              continue
            }
          }
        }

        cellsUpdate.push({
          r,
          c,
          sx: startAxisX,
          sy: startAxisY,
          ex: endAxisX,
          ey: endAxisY,
          columnWidth,
        })
        
        this.drawCell(startAxisX, startAxisY, endAxisX, endAxisY)
      }
    }

    const overflowMap = new Map()

    // 溢出单元格配置保存
    for (let row = startRow; row < endRow; row++) {
      if (worksheet.cells[row] === null) {
        continue
      }

      for (let col = startCol; col < endCol; col++) {
        if (worksheet.cells[row][col] === null) {
          continue
        }

        if (worksheet.colsHidden && worksheet.colsHidden.includes(col)) {
          continue
        }

        // 文本溢出时渲染方式，合并单元格无法溢出
        if (worksheet.cells[row][col] !== null && !isNullish(worksheet.cells[row][col]?.v) && isNullish(worksheet.cells[row][col]?.mc) && worksheet.cells[row][col]?.s?.tw === TextWrap.overflow) {
          const value = worksheet.cells[row][col]?.v || ''

          // TODO: 需要考虑值格式化之后的文本高
          const textMetrics = this.ctx.measureText(value.toString())
          const textWidth = textMetrics.width

          const startAxisX = col === 0 ? -scrollLeft : verticalLinesPosition[col - 1] 
          const endAxisX = verticalLinesPosition[col]
          
          let intervalLeftCol = col
          let intervalRightCol = col

          if ((endAxisX - startAxisX) < textWidth) {
            const textAlign = worksheet.cells[row][col]?.s?.ta??TextAlign.center
            if (textAlign === TextAlign.center) {
              intervalLeftCol = this.trace(row, col, col - 1, textAlign, textWidth, worksheet)
              intervalRightCol = this.trace(row, col, col + 1, textAlign, textWidth, worksheet)
            } else if (textAlign === TextAlign.start) {
              intervalRightCol = this.trace(row, col, col + 1, textAlign, textWidth, worksheet)
            } else {
              intervalLeftCol = this.trace(row, col, col - 1, textAlign, textWidth, worksheet)
            }
          }

          if ((intervalLeftCol <= endCol || intervalRightCol >= startCol) && startCol < endCol) {
            const item = {
              row,
              intervalLeftCol,
              intervalRightCol,
            }
            if (!overflowMap.has(row)) {
              overflowMap.set(row, new Map())
            }

            const colsOverflow = overflowMap.get(row)
            colsOverflow.set(col, item)
          }
        }
      }
    }

    // 绘制
    for (let cellsUpdateIdx = 0; cellsUpdateIdx < cellsUpdate.length; cellsUpdateIdx++) {
      const { r, c, sx, sy, ex, ey} = cellsUpdate[cellsUpdateIdx]
      if (isNullish(worksheet.cells[r][c])) {
        this.drawNullCell(worksheet, r, c, sx, sy, ex, ey, offsetLeft, offsetTop, overflowMap, scrollLeft, scrollTop, startRow, startCol, endRow, endCol)
        continue
      }
    }

    this.ctx.restore()
  }

  // @ts-ignore
  trace(curRow: number, curCol: number, nextCol: number, textAlign: TextAlign, textWidth: number, worksheet: Sheet) {
    if (curCol > nextCol && nextCol < 0) {
      return nextCol
    }

    if (curCol < nextCol && nextCol > worksheet.cells[curRow].length - 1) {
      return nextCol
    }

    if (!isNullish(worksheet.cells[curRow][nextCol]?.mc) || !isNullish(worksheet.cells[curRow][nextCol]?.v)) {
      return nextCol
    }
    
    const curColStartAxisX = curCol === 0 ? 0 : this.polymersheet.store.verticalLinesPosition[curCol - 1]
    const curColEndAxisX = this.polymersheet.store.verticalLinesPosition[curCol]

    const tracedColStartAxisX = nextCol === 0 ? 0 : this.polymersheet.store.verticalLinesPosition[nextCol - 1]
    const tracedColEndAxisX = this.polymersheet.store.verticalLinesPosition[nextCol]

    let intervalLeft = curColStartAxisX
    let intervalRight = curColEndAxisX
    const w = textWidth - (curColEndAxisX - curColStartAxisX)

    if (textAlign === TextAlign.center) {
      intervalLeft -= w / 2
      intervalRight += w / 2
    } else if (textAlign === TextAlign.start) {
      intervalRight += w
    } else {
      intervalLeft -= w / 2
    }
      
    if (curCol < nextCol) {
      // backward
      if (intervalRight > tracedColEndAxisX) {
        return this.trace(curRow, curCol, nextCol + 1, textAlign, textWidth, worksheet)
      } else if (intervalRight > tracedColStartAxisX) {
        // 成功
        return nextCol
      } else {
        return nextCol
      }
    } else {
      // forward
      if (intervalLeft < tracedColStartAxisX) {
        return this.trace(curRow, curCol, nextCol - 1, textAlign, textWidth, worksheet)
      } else if (intervalLeft > tracedColEndAxisX) {
        // 成功
        return nextCol
      } else {
        return nextCol
      }
    }

  }

  drawNullCell(worksheet: Sheet, row: number, col: number, startAxisX: number, startAxisY: number, endAxisX: number, endAxisY: number, offsetLeft: number, offsetTop: number, overflowMap: Map<number, Map<number, any>>, scrollLeft: number, scrollTop: number, startRow: number, startCol: number, endRow: number, endCol: number) {
    // TODO: 背景色
    const cellOverflowInfo = this.getCellOverflowInfo(row, col, endCol, overflowMap)
    if (cellOverflowInfo?.colLast) {
      const { mainCol, mainRow } = cellOverflowInfo
      this.drawOverflowCell(
        worksheet,
        mainRow,
        mainCol,
        startCol,
        endCol,
        overflowMap,
        scrollLeft,
        scrollTop,
        offsetLeft,
        offsetTop,
      )
    }

    // 右边框
  }

  drawOverflowCell(worksheet: Sheet,  mainRow: number, mainCol: number, startCol: number, endCol: number, overflowMap: Map<number, Map<number, any>>, scrollLeft: number, scrollTop: number, offsetLeft: number, offsetTop: number) {
    let startAxisX
    let startAxisY
  
    if (mainCol === 0) {
      startAxisX = -scrollLeft
    } else {
      startAxisX = this.polymersheet.store.verticalLinesPosition[startCol - 1] - scrollLeft
    }
    const endAxisX = this.polymersheet.store.verticalLinesPosition[endCol] - scrollLeft

    if (mainRow === 0) {
      startAxisY = -scrollTop
    } else {
      startAxisY = this.polymersheet.store.horizontalLinesPosition[mainRow - 1] - scrollTop
    }

    const endAxisY = this.polymersheet.store.horizontalLinesPosition[mainRow] - scrollTop

    const textAreaWidth = endAxisX - startAxisX
    const textAreaHeight = endAxisY - startAxisY

    const textInfo = getCellTextInfo(this.ctx, worksheet.cells[mainRow][mainCol]!, {
      textAreaWidth,
      textAreaHeight,
      mainRow,
      mainCol,
      leading: 2,
      letterSpacing: 2,
    })

    this.ctx.save()
    this.ctx.translate(offsetLeft, offsetTop)

    if (!isNullish(textInfo)) {
      this.drawText(textInfo, startAxisX, startAxisY)
    }

    this.ctx.restore()
  }

  drawText(textInfo: any, startAxisX: number, startAxisY: number) {
    const { values } = textInfo

    for (let i = 0; i < values.length; i++) {
      const { text, top, left } = values[i]
      this.ctx.fillText(text, startAxisX + left, startAxisY + top)
    }
  }

  getCellOverflowInfo(row: number, col: number, endCol: number, overflowMap: Map<number, Map< number, any>>) {
    let colIn = false
    let colLast = false
    let mainCol = col
    const sameRowOverflowMap = overflowMap.get(row)
    if (!sameRowOverflowMap) {
      return
    }
    for (const [c, info] of sameRowOverflowMap) {
      const { intervalLeftCol, intervalRightCol } = info
      if (col >= intervalLeftCol && col <= intervalRightCol) {
        colIn = true
        if (col === intervalRightCol || col === endCol) {
          colLast = true
          mainCol = c
          break
        }
      }
    }

    return {
      colIn,
      colLast,
      mainCol,
      mainRow: row,
    }
  }

  drawCell(sx: number, sy: number, ex: number, ey: number) {
    // border lines
    // TODO: border 需要单独渲染
    this.ctx.save()
    this.ctx.strokeStyle = '#dfdfdf'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.moveTo(sx, ey - 0.5)
    this.ctx.lineTo(ex - 0.5, ey - 0.5)
    this.ctx.lineTo(ex - 0.5, sy - 0.5)
    this.ctx.stroke()
    this.ctx.restore()
    
    // content

  }
}