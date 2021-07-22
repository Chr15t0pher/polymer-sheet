import { d } from '../utils'
import type { PolymerSheet } from './PolymerSheet'

export default class ToolBar {
  containerId = '#polymersheet__toolbar'

  constructor(private polymersheet: PolymerSheet) {
  }

  render() {
    d(this.containerId)
      .css({
        height: this.polymersheet.store.toolbarHeight + 'px'
      })
  }
}