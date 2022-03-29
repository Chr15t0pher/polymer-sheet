import { Widget } from './Widget'

import type { Dom } from '../../utils'
import { observer } from '../observer'

@observer
export default class CellsOverlay extends Widget {
  private readonly nodeId = 'polymersheet__cells_overlay'
  private node!: Dom

  mount() {
    const { viewGridNodes } = this.polymersheet
    const parentNode = viewGridNodes[3]

    parentNode?.append(`
			<div id="${this.nodeId}"></div>
		`)

    this.node = parentNode.find(`#${this.nodeId}`)

    this.render()
  }

  render() {
    const { cellsContentWidth, cellsContentHeight } = this.polymersheet.store
    this.node.css({
      width: `${cellsContentWidth}px`,
      height: `${cellsContentHeight}px`
    })
  }
}

