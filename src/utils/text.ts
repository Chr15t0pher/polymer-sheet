import { Cell, TextAlign, TextBaseline, TextWrap } from '../declare'
import { isEnglish, isChinese } from './validate'

// TODO: 把水平和垂直的字符间距摘出来成配置项
const horizontalSpace = 2
const verticalSpace = 2
const rt = 0

export function getCellTextInfo(ctx: CanvasRenderingContext2D, cell: Cell, options: { textAreaWidth: number, textAreaHeight: number, mainRow: number, mainCol: number, leading: number, letterSpacing: number }) {
  const textAlign = cell.s?.ta || TextAlign.start
  const textBaseline = cell.s?.tba || TextBaseline.middle
  const value = cell.v === void 0 || cell.v === null ? null : cell.w === void 0 || cell.w === null ? cell.v.toString() : cell.w 
  const textWrap = cell.s === void 0 || cell.s === null || cell.s.tw === void 0 || cell.s.tw === null ? TextWrap.break : cell.s.tw
  const { textAreaHeight, textAreaWidth, leading, letterSpacing } = options
  const textInfo: any = { lines: [] }

  if (value === null) {
    return
  }

  // // TODO: 考虑竖排文字
  // if (cell.s?.to === TextOrientation.vertical) {
  //   // align text vertically
  //   ctx.textBaseline = TextBaseline.top
  //   const splitedValue = value.split('')
  //   const metrics = measureText(ctx, cell.w || '')
  // }

  if (textWrap === TextWrap.auto) {
    // 自动换行
    const words = []
    let preWord = ''
    for (let i = 0; i < value.length; i++) {
      if (isChinese(value[i]) || value[i] === ' ' || value[i] === '\n') {
        if(preWord.length > 0) {
          words.push(preWord)
          preWord = ''
        }
        words.push(value[i])
      } else {
        preWord += value[i]
        if (i === value.length - 1) {
          words.push(preWord)
          preWord = ''
        }
      }
    }
  
    const lines = []
    let line = ''
    for (let i = 0; i < words.length; i++) {
      const { width } = ctx.measureText(line + words[i])
      if (words[i] === '\n') {
        lines.push(line)
        lines.push(words[i])
        line = ''
      } else if (width > textAreaWidth) {
        lines.push(line)
        line = words[i]
      } else {
        line += words[i]
      }
      if (i === words.length - 1 && line.length > 0) {
        lines.push(line)
      }
    }
  } else {
    // 溢出和截断
    const textMetrics = ctx.measureText(value)
    const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } = textMetrics
    const textWidth = width
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent

    let left = letterSpacing 
    if (textAlign === TextAlign.center) {
      left = (textAreaWidth - textWidth) / 2
    } else if (textAlign === TextAlign.end) {
      left = textAreaWidth - textWidth
    }

    let top = textAreaHeight - leading
    if (textBaseline === TextBaseline.top) {
      top = textAreaHeight - leading - actualBoundingBoxDescent - actualBoundingBoxAscent
    } else if (textBaseline === TextBaseline.middle) {
      top = textAreaHeight - leading - actualBoundingBoxDescent
    }

    textInfo.lines.push({
      text: value,
      top,
      left,
      textHeight, 
      textWidth,
    })

    return textInfo
  }

  return textInfo
}
