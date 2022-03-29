import { Widget } from './Widget'

import { findCellPosition, transNumToColumnIdx, isNullish, getCellTextInfo } from '../../utils'
import { Brush } from '../../utils'
import { TextWrap, TextAlign } from '../../declare'

import type { Sheet } from '../../declare'
import type { OverflowMap } from '../Store'
import type { TextInfo } from './../../utils/text'

interface CellPositionInfo {
  /** rowIndex */
  r: number,
  /** columnIndex */
  c: number,
  /** startAxisX */
  sx: number,
  /** startAxisY */
  sy: number,
  /** endAxisX */
  ex: number,
  /** endAxisY */
  ey: number,
}

export default class Content extends Widget {
  private readonly nodeId = 'polymersheet__content'

  private brush!: Brush

  mount() {
    const parentNode = this.polymersheet.viewNode

    parentNode?.prepend(`
			<canvas id="${this.nodeId}"></canvas>
		`)

    this.brush = new Brush(`#${this.nodeId}`)

    this.update()
  }

  update() {
    const { contentWidth, contentHeight, devicePixelRatio } = this.polymersheet.store
    const worksheet = this.polymersheet.getWorksheet()

    this.brush
      .clearAll()
      .size(contentWidth, contentHeight, devicePixelRatio)

    this.drawBackground()
    this.drawContent(worksheet)
    this.drawRowHeader(worksheet)
    this.drawColumnHeader(worksheet)
    this.drawUpperLeftCorner()
  }

  drawBackground() {
    const { contentWidth, contentHeight, styles: { backgroundColor } } = this.polymersheet.store
    this.brush.rect(
      { x: 0, y: 0 },
      { x: contentWidth, y: contentHeight },
      {
        fillStyle: backgroundColor
      }
    )
  }

  drawUpperLeftCorner() {
    const { columnHeaderHeight, rowHeaderWidth, styles: { upperLeftCorner: styles = {} } } = this.polymersheet.store
    const { borderWidth = 1 } = styles
    const halfBorder = borderWidth / 2

    this.brush.cell(
      { x: 0, y: 0	},
      {	x: rowHeaderWidth - halfBorder, y: columnHeaderHeight - halfBorder	},
      {
        lineWidth: borderWidth,
        strokeStyle: styles.borderColor,
        fillStyle: styles.backgroundColor
      }
    )
  }

  drawRowHeader(worksheet: Sheet) {
    const {
      columnHeaderHeight,
      contentHeight,
      horizontalLinesPosition,
      rowHeaderWidth,
      styles: { header: headerStyles = {} }
    } = this.polymersheet.store
    const { scrollTop = 0 } = worksheet

    let startRow = findCellPosition(horizontalLinesPosition, scrollTop)
    let endRow = findCellPosition(horizontalLinesPosition, scrollTop + contentHeight)

    if (startRow === -1) {
      startRow = 0
    }

    if (endRow === -1) {
      endRow = horizontalLinesPosition.length - 1
    }

    this.brush
      .save()
      .translate(0, columnHeaderHeight)
    // 绘制背景，不能在循环中和边框交叉绘制，否则在低设备像素比(如 0.67、 0.33)时会出现某些线条被吞并的情况
      .rect(
        { x: 0, y: 0 },
        { x: rowHeaderWidth, y: horizontalLinesPosition[endRow] - scrollTop },
        {
          fillStyle: headerStyles.default?.backgroundColor
        }
      )

    for (let i = startRow; i <= endRow; i++) {
      if (worksheet.rowsHidden?.includes(i)) {
        continue
      }

      const preCurrentRowEndAxisY = i === 0 ? -scrollTop : horizontalLinesPosition[i - 1] - scrollTop
      const currentRowEndAxisY = horizontalLinesPosition[i] - scrollTop

      this.drawHeader(
        0,
        preCurrentRowEndAxisY,
        rowHeaderWidth,
        currentRowEndAxisY,
        `${i + 1}`,
      )
    }

    this.brush.restore()
  }

  drawColumnHeader(worksheet: Sheet) {
    const {
      rowHeaderWidth,
      contentWidth,
      verticalLinesPosition,
      columnHeaderHeight,
      styles: { header: headerStyles = {} }
    } = this.polymersheet.store
    const { scrollLeft = 0 } = worksheet

    let startCol = findCellPosition(verticalLinesPosition, scrollLeft)
    let endCol = findCellPosition(verticalLinesPosition, scrollLeft + contentWidth)

    if (startCol === -1) {
      startCol = 0
    }
    if (endCol === -1) {
      endCol = verticalLinesPosition.length - 1
    }

    this.brush
      .save()
      .translate(rowHeaderWidth, 0)
    // 绘制背景，不能在循环中和边框交叉绘制，否则在低设备像素比(如 0.67、 0.33)时会出现某些线条被吞并的情况
      .rect(
        { x: 0, y: 0 },
        { x: verticalLinesPosition[endCol] - scrollLeft, y: columnHeaderHeight },
        {
          fillStyle: headerStyles.default?.backgroundColor
        }
      )

    for (let i = startCol; i <= endCol; i++) {
      if (worksheet.colsHidden && worksheet.colsHidden.includes(i)) {
        continue
      }

      const preCurrentColEndAxisX = i === 0 ? -scrollLeft : verticalLinesPosition[i - 1] - scrollLeft
      const currentColEndAxisX = verticalLinesPosition[i] - scrollLeft
      const columnNum = transNumToColumnIdx(i)
      this.drawHeader(
        preCurrentColEndAxisX,
        0,
        currentColEndAxisX,
        columnHeaderHeight,
        columnNum
      )
    }

    this.brush.restore()
  }

  private drawHeader(startAxisX: number, startAxisY: number, endAxisX: number, endAxisY: number, txt: string) {
    const { styles: { header: headerStyles = {} } } = this.polymersheet.store
    const { borderWidth = 1 } = headerStyles.default || {}
    const halfBorder = borderWidth / 2

    this.brush
      .cell(
        { x: startAxisX, y: startAxisY },
        {	x: endAxisX - halfBorder, y: endAxisY - halfBorder },
        {
          lineWidth: borderWidth,
          strokeStyle: headerStyles?.default?.borderColor,
        },
      )
      .text(
        txt,
        {
          x: (startAxisX + endAxisX - borderWidth) / 2,
          y: (startAxisY + endAxisY - borderWidth) / 2
        },
        {
          fillStyle: headerStyles?.default?.fontColor,
          fontSize: headerStyles?.default?.fontSize,
          fontFamily: headerStyles?.default?.fontFamily,
          textAlign: 'center',
          textBaseline: 'middle'
        }
      )
  }

  drawContent(worksheet: Sheet) {
    const {
      rowHeaderWidth,
      columnHeaderHeight,
      contentWidth,
      contentHeight,
      verticalLinesPosition,
      horizontalLinesPosition,
      styles: { cell: cellStyles }
    } = this.polymersheet.store
    const { scrollTop = 0, scrollLeft = 0 } = worksheet

    let startRow = findCellPosition(horizontalLinesPosition, scrollTop)
    let endRow = findCellPosition(horizontalLinesPosition, scrollTop + contentHeight)
    let startCol = findCellPosition(verticalLinesPosition, scrollLeft)
    let endCol = findCellPosition(verticalLinesPosition, scrollLeft + contentWidth)

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

    const cellsUpdate: CellPositionInfo[] = []
    const mergeCache: Dictionary<number> = {}

    for (let r = startRow; r <= endRow; r++) {
      if (worksheet.rowsHidden?.includes(r)) {
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

        if (worksheet.cells[r][c] !== null) {
          const value = worksheet.cells[r][c]

          if (!isNullish(value) && 'mc' in value) {
            const mergeMainRow = value.mc!.rs
            const mergeMainCol = value.mc!.cs
            const mergeCacheKey = mergeMainRow + '_' + mergeMainCol
            if (isNullish(mergeCache[mergeCacheKey])) {
              const mergeMainEndRow = value.mc!.rd
              const mergeMainEndCol = value.mc!.cd
              const mergeMainStartAxisX = mergeMainCol === 0 ? -scrollLeft : verticalLinesPosition[mergeMainCol - 1] - scrollLeft
              const mergeMainEndAxisX = verticalLinesPosition[mergeMainCol] - scrollLeft
              const mergeMainStartAxisY = mergeMainRow === 0 ? -scrollTop : horizontalLinesPosition[mergeMainRow - 1] - scrollTop
              const mergeMainEndAxisY = horizontalLinesPosition[mergeMainRow] - scrollTop
              const mergeMain = {
                r: mergeMainRow,
                c: mergeMainCol,
                sx: mergeMainStartAxisX,
                sy: mergeMainStartAxisY,
                ex: mergeMainEndAxisX,
                ey: mergeMainEndAxisY,
              }
              for (let i = mergeMainRow + 1; i <= mergeMainEndRow; i++) {
                mergeMain.ey += horizontalLinesPosition[i] - horizontalLinesPosition[i - 1]
              }
              for (let j = mergeMainCol + 1; j <= mergeMainEndCol; j++) {
                mergeMain.ex += verticalLinesPosition[j] - verticalLinesPosition[j - 1]
              }
              mergeCache[mergeMainRow + '_' + mergeMainCol] = cellsUpdate.length
              cellsUpdate.push(mergeMain)
            }
            continue
          }
        }

        cellsUpdate.push({
          r,
          c,
          sx: startAxisX,
          sy: startAxisY,
          ex: endAxisX,
          ey: endAxisY,
        })
      }
    }

    const { overflowMap } = this.polymersheet.store

    // 保存溢出单元格配置
    for (let row = startRow; row < endRow; row++) {
      if (worksheet.cells[row] === null) {
        continue
      }

      for (let col = startCol; col < endCol; col++) {
        if (worksheet.cells[row][col] === null) {
          continue
        }

        if (worksheet.colsHidden?.includes(col)) {
          continue
        }

        // 文本溢出时渲染方式，合并单元格无法溢出
        if (worksheet.cells[row][col] !== null && !isNullish(worksheet.cells[row][col]?.v) && isNullish(worksheet.cells[row][col]?.mc) && worksheet.cells[row][col]?.s?.tw === TextWrap.overflow) {
          const value = worksheet.cells[row][col]?.v || ''

          // TODO: 需要考虑值格式化之后的文本高
          const { width: textWidth } = this.brush.ctx.measureText(value.toString())

          const startAxisX = col === 0 ? -scrollLeft : verticalLinesPosition[col - 1] - scrollLeft
          const endAxisX = verticalLinesPosition[col] - scrollLeft

          let intervalLeftCol = col
          let intervalRightCol = col

          if ((endAxisX - startAxisX) < textWidth) {
            const textAlign = worksheet.cells[row][col]?.s?.ta??TextAlign.start
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

            const colsOverflow = overflowMap.get(row)!
            colsOverflow.set(col, item)
          }
        }
      }
    }

    this.brush
      .save()
      .translate(rowHeaderWidth, columnHeaderHeight)
    // 绘制背景，不能在循环中和边框交叉绘制，否则在低设备像素比(如 0.67、 0.33)时会出现某些线条被吞并的情况
      .rect(
        { x: 0, y: 0 },
        { x: verticalLinesPosition[endCol] - scrollLeft, y: horizontalLinesPosition[endRow] - scrollTop },
        {
          fillStyle: cellStyles?.default?.backgroundColor
        }
      )


    // 绘制单元格边框及内容
    for (let cellsUpdateIdx = 0; cellsUpdateIdx < cellsUpdate.length; cellsUpdateIdx++) {
      const { r, c, sx, sy, ex, ey } = cellsUpdate[cellsUpdateIdx]
      const cell = worksheet.cells[r][c]
      if (!cell) {
        this.drawNullCell(worksheet, r, c, sx, sy, ex, ey, overflowMap, startCol, endCol)
      } else {
        if (isNullish(cell.v) || !isNullish(cell.v) && cell?.v?.toString().length === 0) {
          this.drawNullCell(worksheet, r, c, sx, sy, ex, ey, overflowMap, startCol, endCol)
        } else {
          this.drawCell(worksheet, r, c, sx, sy, ex, ey, overflowMap, startCol, endCol)
        }
      }
    }

    this.brush.restore()
  }

  inView(col: number, row: number, scrollleft: number, scrollTop: number) {
    //
  }

  drawNullCell(worksheet: Sheet, row: number, col: number, startAxisX: number, startAxisY: number, endAxisX: number, endAxisY: number, overflowMap: OverflowMap, startCol: number, endCol: number) {
    const cellOverflowInfo = this.getCellOverflowInfo(row, col, endCol, overflowMap)

    if (cellOverflowInfo?.colLast) {
      const { mainCol, mainRow } = cellOverflowInfo
      this.drawOverflowCell(
        worksheet,
        mainRow,
        mainCol,
        startCol,
        endCol
      )
    }

    if (cellOverflowInfo?.colLast || !cellOverflowInfo) {
      this.drawCellBorderRight(startAxisY, endAxisX, endAxisY)
    }

    this.drawCellBorderBottom(startAxisX, endAxisX, endAxisY)
  }

  private drawOverflowCell(worksheet: Sheet, mainRow: number, mainCol: number, startCol: number, endCol: number) {
    const { scrollTop = 0, scrollLeft = 0 } = worksheet

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

    const textInfo = getCellTextInfo(this.brush.ctx, worksheet.cells[mainRow][mainCol]!, {
      textAreaWidth,
      textAreaHeight,
      mainRow,
      mainCol,
      leading: 2,
      letterSpacing: 2,
    })

    if (!isNullish(textInfo)) {
      this.drawText(textInfo, startAxisX, startAxisY)
    }
  }

  private drawCell(worksheet: Sheet, row: number, col: number, startAxisX: number, startAxisY: number, endAxisX: number, endAxisY: number, overflowMap: OverflowMap, startCol: number, endCol: number) {
    const cell = worksheet.cells[row][col]

    if (!cell) {
      return
    }

    const cellOverflowInfo = this.getCellOverflowInfo(row, col, endCol, overflowMap)
    let needToDrawRightBorder = true

    if (cellOverflowInfo) {
      if (cellOverflowInfo.colLast) {
        const { mainCol, mainRow } = cellOverflowInfo
        this.drawOverflowCell(
          worksheet,
          mainRow,
          mainCol,
          startCol,
          endCol,
        )
      } else {
        needToDrawRightBorder = false
      }
    }

    const textInfo = getCellTextInfo(this.brush.ctx, cell, {
      textAreaWidth: endAxisX - startAxisX,
      textAreaHeight: endAxisY - startAxisY,
      mainRow: row,
      mainCol: col,
      leading: 2,
      letterSpacing: 2,
    })

    if (needToDrawRightBorder) {
      this.drawCellBorderRight(startAxisY, endAxisX, endAxisY)
    }

    this.drawCellBorderBottom(startAxisX, endAxisX, endAxisY)

    if (!cellOverflowInfo) {
      this.drawText(textInfo, startAxisX, startAxisY)
    }
  }

  private getCellBorderStyles() {
    const { styles: { cell: cellStyles }} = this.polymersheet.store
    const borderStyles = {
      lineWidth: cellStyles?.default?.borderWidth,
      strokeStyle: cellStyles?.default?.borderColor
    }

    return borderStyles
  }

  private drawCellBorderRight(startAxisY: number, endAxisX: number, endAxisY: number) {
    const borderStyles = this.getCellBorderStyles()
    const halfBorder = (borderStyles?.lineWidth || 1) / 2
    this.brush
      .line(
        { x: endAxisX - halfBorder, y: startAxisY - halfBorder },
        { x: endAxisX - halfBorder, y: endAxisY },
        borderStyles
      )
  }

  private drawCellBorderBottom(startAxisX: number, endAxisX: number, endAxisY: number) {
    const borderStyles = this.getCellBorderStyles()
    const halfBorder = (borderStyles?.lineWidth || 1) / 2
    this.brush
      .line(
        { x: startAxisX - halfBorder, y: endAxisY - halfBorder },
        { x: endAxisX - halfBorder, y: endAxisY - halfBorder },
        borderStyles
      )
  }

  private drawText(textInfo: TextInfo, startAxisX: number, startAxisY: number) {
    const { lines } = textInfo

    for (let i = 0; i < lines.length; i++) {
      const { text, top, left } = lines[i]
      this.brush.text(
        text,
        { x: startAxisX + left, y: startAxisY + top },
        {
          fontSize: 10
        }
      )
    }
  }

  // @ts-ignore
  private trace(curRow: number, curCol: number, nextCol: number, textAlign: TextAlign, textWidth: number, worksheet: Sheet) {
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

  private getCellOverflowInfo(row: number, col: number, endCol: number, overflowMap: OverflowMap) {
    let colIn = false
    let colLast = false
    const sameRowOverflowMap = overflowMap.get(row)
    if (!sameRowOverflowMap) {
      return
    }
    const mainRow = row
    let mainCol = null
    for (const [c, info] of sameRowOverflowMap) {
      const { intervalLeftCol, intervalRightCol } = info
      if (col >= intervalLeftCol && col <= intervalRightCol) {
        colIn = true
        mainCol = c
        if (col === intervalRightCol || col === endCol) {
          colLast = true
        }
        return {
          colIn,
          colLast,
          mainRow,
          mainCol,
        }
      }
    }
    return
  }
}
