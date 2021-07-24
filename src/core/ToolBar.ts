import { d } from '../utils'
import type { PolymerSheet } from './PolymerSheet'

export default class ToolBar {
  containerId = '#polymersheet__toolbar'

  constructor(private polymersheet: PolymerSheet) {
  }

  mount() {
    console.info('toolbar mount')
  }

  // render() {
  // }
}