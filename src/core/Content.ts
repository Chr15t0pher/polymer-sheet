import type { PolymerSheet } from './PolymerSheet'
import { Sheet } from '../declare'
import { d, position_binary_search, transNumToColumnIdx } from '../utils'

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
    const scrollLeft = worksheet.scrollLeft
    const scrollTop = worksheet.scrollTop

    this.drawRowHeader(worksheet, scrollTop)
    this.drawColumnHeader(worksheet, scrollLeft)
    this.drawContent()
  }

  drawRowHeader(worksheet: Sheet, scrollTop?: number) {
    if (!scrollTop) {
      scrollTop = 0
    }
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

  drawColumnHeader(worksheet: Sheet, scrollLeft?: number) {
    if (!scrollLeft) {
      scrollLeft = 0
    }
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
      this.ctx.moveTo(currentColEndAxisX + 0.5, 0)
      this.ctx.lineTo(currentColEndAxisX + 0.5, columnHeaderHeight - 1)
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

  drawContent() {
    //
  }
}