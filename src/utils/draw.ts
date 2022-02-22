import { getType, isOdd, pick } from './helpers'

export interface DrawingStyles extends
  Partial<CanvasFillStrokeStyles>,
  Partial<Omit<CanvasPathDrawingStyles, 'getLineDash' | 'setLineDash'>>,
  Partial<CanvasTextDrawingStyles>,
  Partial<CanvasShadowStyles>,
  Partial<CanvasCompositing> {
  lineDash?: number[],
}

export interface Point {
  x: number,
  y: number,
}

/**
 * 对坐标值进行处理，解决奇数像素的线绘制时会模糊的问题
 */
function defuzzy(point: Point, lineWidth: number) {
  let { x, y } = point

  if (isOdd(lineWidth)) {
    x = Math.floor(x) - 0.5
    y = Math.floor(y) - 0.5
  }

  return { x, y }
}

export class Brush {
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D

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

  size(width: number, height: number, scaleX = 1, scaleY?: number) {
    if (!scaleY) {
      scaleY = scaleX
    }

    this.canvas.width = width * scaleX
    this.canvas.height = height * scaleY
    this.ctx.scale(scaleX, scaleY)

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
    this.ctx.translate(x, y)
    return this
  }

  /**
	 * 绘制多条线段,
	 * @param points
	 * @param styles
	 * @returns
	 */
  polyline(points: Point[], styles: DrawingStyles) {
    const filteredStyles = {...styles}

    this.save()
    this.ctx.beginPath()

    // 移除无关属性
    delete filteredStyles.lineDash
    filteredStyles.lineWidth = filteredStyles.lineWidth || 1

    for (const styleName in filteredStyles) {
      // @ts-ignore
      this.ctx[styleName] = filteredStyles[styleName]
    }

    styles.lineDash && this.ctx.setLineDash(styles.lineDash)

    const [startPoint, ...restPoints] = points
    const { lineWidth } = filteredStyles
    const newStartPoint = defuzzy(startPoint, lineWidth)

    this.ctx.moveTo(newStartPoint.x, newStartPoint.y)

    restPoints.forEach(point => {
      point = defuzzy(point, lineWidth)
      this.ctx.lineTo(point.x, point.y)
    })

    styles.strokeStyle && this.ctx.stroke()
    styles.fillStyle && this.ctx.fill()

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
        { x: point1.x, y: point2.y },
        point1
      ],
      styles
    )
  }

  /**
	 * 绘制单元格，只绘制底边和右边边框
	 * @param point1 左上角点坐标
	 * @param point2 右下角点坐标
	 * @param styles
	 */
  cell(point1: Point, point2: Point, styles: DrawingStyles = {}) {
    const backgroundStyles = {
      ...styles,
      strokeStyle: styles.fillStyle
    }

    const borderStyles = {
      ...styles,
      fillStyle: undefined
    }

    this.rect(
      { x: point1.x + 1, y: point1.y + 1},
      { x: point2.x - 1, y: point2.y - 1},
      backgroundStyles
    )

    this.polyline(
      [
        { x: point2.x, y: point1.y},
        point2,
        { x: point1.x, y: point2.y },
      ],
      borderStyles
    )

    return this
  }

  text(txt: string, pos: Point, styles: DrawingStyles = {}) {
    this.save()

    for (const styleName in styles) {
      // @ts-ignore
      this.ctx[styleName] = styles[styleName]
    }
    this.ctx.fillText(txt, pos.x, pos.y)
    this.restore()

    return this
  }
}
