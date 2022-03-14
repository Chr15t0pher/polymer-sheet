import { getType, isOdd, isNullish } from './helpers'
import { FontWeight, FontStyle } from '../declare'

export interface DrawingStyles extends
  Partial<CanvasFillStrokeStyles>,
  Partial<Omit<CanvasPathDrawingStyles, 'getLineDash' | 'setLineDash'>>,
  Partial<CanvasShadowStyles>,
  Partial<CanvasCompositing> {
  lineDash?: number[],
}

export interface TextStyles extends
  Partial<CanvasFillStrokeStyles>,
  Partial<Omit<CanvasTextDrawingStyles, 'font'>> {
  fontSize?: number,
  fontFamily?: string,
  fontWeight?: FontWeight,
  fontStyle?: FontStyle
}

export interface Point {
  x: number,
  y: number,
}

const round = Math.round

const DefaultFontFamily = 'Roboto,RobotoDraft,Helvetica,Arial,sans-serif'

function defuzzyPixel(x: number, lineWidth: number) {
  if (!lineWidth) {
    return round(x)
  }

  const doubledX = round(x * 2)
  return isOdd(doubledX + round(lineWidth))
    ? (doubledX - 1) / 2
    : doubledX / 2
}

/**
 * 对坐标值进行处理，解决奇数像素的线绘制时会模糊的问题
 */
function defuzzy(point: Point, lineWidth: number, scale: number) {
  let { x, y } = point

  x = defuzzyPixel(x * scale, lineWidth)
  y = defuzzyPixel(y * scale, lineWidth)

  return { x, y }
}

export class Brush {
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D
  scale!: number

  constructor(target: HTMLCanvasElement | string) {
    if (typeof target === 'string') {
      const elm = document.querySelector(target)
      if (!elm || getType(elm) !== 'HTMLCanvasElement') {
        throw new Error(`cannot find canvas node with selector '${target}'`)
      }

      // @ts-ignore
      this.canvas = elm
    } else {
      this.canvas = target
    }

    this.ctx = this.canvas.getContext('2d')!
  }

  size(width: number, height: number, dpr = 1) {
    this.scale = dpr
    const canvasWidth = Math.floor(width * dpr)
    const canvasHeight = Math.floor(height * dpr)
    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight
    const styleWidth = canvasWidth / dpr
    const styleHeight = styleWidth * canvasHeight / canvasWidth
    this.canvas.style.width = `${styleWidth}px`
    this.canvas.style.height = `${styleHeight}px`

    return this
  }

  clearAll() {
    const { width, height } = this.canvas
    this.ctx.clearRect(0, 0, width, height)
    return this
  }

  clear(startPoint: Point, endPoint: Point) {
    this.ctx.clearRect(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
    return this
  }

  save() {
    this.ctx.save()
    return this
  }

  restore() {
    this.ctx.restore()
    return this
  }

  translate(x: number, y: number) {
    const { scale } = this
    this.ctx.translate(round(x * scale), round(y * scale))
    return this
  }

  /**
	 * 绘制多条线段,
	 * @param points
	 * @param styles
	 * @returns
	 */
  polyline(points: Point[], styles: DrawingStyles, needClosePath?: boolean) {
    const { scale } = this
    const filteredStyles = {...styles}

    // 移除无关属性
    delete filteredStyles.lineDash

    const needFill = !isNullish(filteredStyles.fillStyle)
    const needStroke = !isNullish(filteredStyles.strokeStyle)
    let lineWidth = needFill && !needStroke ? 0 : (filteredStyles.lineWidth || 1)
    // The fill operation will reduces the border width by half
    lineWidth = Math.max(Math.floor(lineWidth * scale), 1)
    filteredStyles.lineWidth = needFill ? lineWidth * 2 : lineWidth

    this.save()
    this.ctx.beginPath()

    for (const styleName in filteredStyles) {
      // @ts-ignore
      this.ctx[styleName] = filteredStyles[styleName]
    }

    styles.lineDash && this.ctx.setLineDash(styles.lineDash)

    points = points.map(point => defuzzy(point, filteredStyles.lineWidth!, scale))

    const [startPoint, ...restPoints] = points

    this.ctx.moveTo(startPoint.x, startPoint.y)
    restPoints.forEach(point => {
      this.ctx.lineTo(point.x, point.y)
    })

    if (needClosePath) {
      this.ctx.closePath()
    }

    filteredStyles.strokeStyle && this.ctx.stroke()
    needFill && this.ctx.fill()

    this.restore()

    return this
  }

  line(startPoint: Point, endPoint: Point, styles: DrawingStyles) {
    this.polyline([startPoint, endPoint], styles)
    return this
  }

  /**
	 * 绘制矩形，需显式指定 `strokeStyle` 或 `fillStyle` 才能进行对应的描边或填充操作
	 * @param point1 左上角点坐标
	 * @param point2 右下角点坐标
	 * @param styles
	 */
  rect(point1: Point, point2: Point, styles: DrawingStyles) {
    this.polyline(
      [
        point1,
        { x: point2.x, y: point1.y},
        point2,
        { x: point1.x, y: point2.y }
      ],
      styles,
      true
    )
  }

  /**
	 * 绘制单元格，只绘制底边和右边边框
	 * @param point1 左上角点坐标
	 * @param point2 右下角点坐标
	 * @param styles
	 */
  cell(point1: Point, point2: Point, styles: DrawingStyles = {}) {
    const lineWidth = styles.lineWidth || 1
    const backgroundStyles = {
      ...styles,
      strokeStyle: undefined
    }

    const borderStyles = {
      ...styles,
      fillStyle: undefined
    }

    this.rect(
      { x: point1.x, y: point1.y },
      { x: point2.x - lineWidth * 0.5, y: point2.y - lineWidth * 0.5 },
      backgroundStyles
    )

    this.polyline(
      [
        { x: point2.x, y: point1.y },
        point2,
        { x: point1.x, y: point2.y },
      ],
      borderStyles
    )

    return this
  }

  text(txt: string, pos: Point, styles: TextStyles = {}) {
    const { scale } = this
    let { fontSize } = styles

    if (fontSize) {
      fontSize = round(fontSize * scale)
    }

    const {
      fontWeight = FontWeight.normal,
      fontStyle = FontStyle.normal,
      fontFamily = DefaultFontFamily
    } = styles

    this.save()

    for (const styleName in styles) {
      // @ts-ignore
      this.ctx[styleName] = styles[styleName]
    }

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

    this.ctx.fillText(txt, round(pos.x * scale), round(pos.y * scale))
    this.restore()

    return this
  }
}
