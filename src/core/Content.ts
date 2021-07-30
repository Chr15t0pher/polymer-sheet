import { d, position_binary_search, transNumToColumnIdx } from '../utils'
import type { PolymerSheet } from './PolymerSheet'

export default class Content {
  containerId = '#polymersheet__view'

  ctx!: CanvasRenderingContext2D

  constructor(private polymersheet: PolymerSheet) {}

  mount() {
    const ctx = (d(`${this.containerId} #polymersheet__content`).elem() as HTMLCanvasElement).getContext('2d')
    if (!ctx) {
      throw new Error('fail to get canvas 2D context')
    } else {
      // const start_row
      this.ctx = ctx
    }
  }

  draw() {
    const worksheet = this.polymersheet.getWorksheet()
    const scrollLeft = worksheet.scrollLeft
    const scrollTop = worksheet.scrollTop

    this.drawRowHeader(scrollTop)
    this.drawColumnHeader()
    this.drawContent()
  }

  drawRowHeader(scrollTop?: number) {
    if (!scrollTop) {
      scrollTop = 0
    }
  }

  drawColumnHeader(scrollLeft?: number) {
    if (!scrollLeft) {
      scrollLeft = 0
    }
    const offsetLeft = this.polymersheet.store.rowHeaderWidth!
    const contentWidth = this.polymersheet.store.contentWidth
    const verticalLinesPosition = this.polymersheet.store.verticalLinesPosition
    const columnHeaderHeight = this.polymersheet.store.columnHeaderHeight!
    console.info(this.polymersheet.store.verticalLinesPosition, scrollLeft)

    let start_col = position_binary_search(verticalLinesPosition, scrollLeft)
    let end_col = position_binary_search(verticalLinesPosition, scrollLeft + contentWidth)

    if (start_col === -1) {
      start_col = 0
    }
    if (end_col === -1) {
      end_col = verticalLinesPosition.length - 1
    }

    this.ctx.clearRect(offsetLeft, 0, contentWidth - offsetLeft, columnHeaderHeight)
    for (let i = start_col; i <= end_col; i++) {
      // vertical lines
      this.ctx.save()
      this.ctx.translate(offsetLeft, 0)
      this.ctx.beginPath()
      this.ctx.moveTo(verticalLinesPosition[i] - scrollLeft + 0.5, 0)
      this.ctx.lineTo(verticalLinesPosition[i] - scrollLeft + 0.5, columnHeaderHeight)
      this.ctx.strokeStyle = '#dfdfdf'
      this.ctx.lineWidth = 1
      this.ctx.closePath()
      this.ctx.stroke()

      // horizontal lines
      this.ctx.beginPath()
      if (i === start_col) {
        this.ctx.moveTo(0, columnHeaderHeight - 0.5)
      } else {
        this.ctx.moveTo(verticalLinesPosition[i - 1] - scrollLeft, columnHeaderHeight - 0.5)
      }
      this.ctx.lineTo(verticalLinesPosition[i] - scrollLeft, columnHeaderHeight - 0.5)
      this.ctx.closePath()
      this.ctx.stroke()

      // draw content
      const columnNum = transNumToColumnIdx(i)
      const preStartColHorizontalAxis = i === 0 ? -scrollLeft : verticalLinesPosition[i - 1] - scrollLeft
      const textHorizontalPos = Math.round((preStartColHorizontalAxis + (verticalLinesPosition[i] - scrollLeft)) / 2)
      const textVerticalPos = Math.round(columnHeaderHeight / 2)

      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(columnNum, textHorizontalPos, textVerticalPos)
      this.ctx.restore()
    }
  }

  drawContent() {
    //
  }
}