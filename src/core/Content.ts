import { d } from '../utils'
import type { PolymerSheet } from './PolymerSheet'

export default class Content {
  containerId = '#polymersheet__view'

  ctx!: CanvasRenderingContext2D

  constructor(private polymersheet: PolymerSheet) {
  }

  mount() {
    const ctx = (d(`${this.containerId} #polymersheet__content`).elem() as HTMLCanvasElement).getContext('2d')
    if (!ctx) {
      throw new Error('fail to get canvas 2D context')
    } else {
      // const start_row
      this.ctx = ctx
    }
  }
}