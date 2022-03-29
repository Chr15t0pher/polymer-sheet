import { Widget } from './Widget'
import { KeyCode } from '../../declare'

import type { Dom } from '../../utils'
import type { PolymerSheet } from '../PolymerSheet'
import { observer } from '../observer'

@observer
export default class AddRows extends Widget {
  private readonly nodeClassName = 'polymersheet__add_rows_container'

  private node!: Dom
  private addBtn!: Dom
  private rowsInput!: Dom<HTMLInputElement>

  constructor(protected polymersheet: PolymerSheet) {
    super(polymersheet)
    this.handleAddRows = this.handleAddRows.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
  }

  mount() {
    const parentNode = this.polymersheet.viewGridNodes[3]
    parentNode?.prepend(`
			<div class="${this.nodeClassName}">
				<button>添加</button>
				<input type="number" min="1" />
				<span>行（在底部添加）。</span>
			</div>
		`)

    this.node = parentNode.find(`.${this.nodeClassName}`)
    this.addBtn = this.node.find('button')
    this.rowsInput = this.node.find('input') as Dom<HTMLInputElement>

    this.addBtn.elem().addEventListener('click', this.handleAddRows)
    this.rowsInput.elem().addEventListener('keydown', this.handleKeydown)
  }

  render() {
    const { worksheetActualHeight, worksheet: { scrollTop = 0 } } = this.polymersheet.store
    const top = worksheetActualHeight - scrollTop + 10

    this.node.css({
      top: `${top}px`
    })
  }

  unmount() {
    this.addBtn.elem().removeEventListener('click', this.handleAddRows)
    this.rowsInput.elem().removeEventListener('keydown', this.handleKeydown)
  }

  handleKeydown(e: KeyboardEvent) {
    if (e.code === KeyCode.enter) {
      this.handleAddRows()
    }
  }

  handleAddRows() {
    const rowLen = this.polymersheet.store.worksheet.cells.length
    const value = Math.floor(Number(this.rowsInput.elem().value))
    this.polymersheet.insertRows(rowLen, value)
  }
}
