import './index.styl'

import { throttle } from 'throttle-debounce'

import type { Widget } from './widgets/Widget'
import type { Dom } from '../utils'
import type { Cell } from '../declare'
import Widgets from './widgets'
import { defaultPolymerSheetOptions, PolymerSheetStore } from './Store'

import { mergeOptions, d } from '../utils'
import { PolymerSheetOptions } from '../declare'

import { observer } from './observer'

@observer
export class PolymerSheet {
  private readonly rootNodeId = 'polymersheet'
  private readonly viewNodeId = 'polymersheet__view'
  private readonly viewGridClassName = 'polymersheet__view_grid'

  containerNode!: Dom
  rootNode!: Dom
  viewNode!: Dom
  viewGridNodes!: Dom[]

  store: PolymerSheetStore

  widgets: Widget[] = []

  constructor(options: Partial<PolymerSheetOptions>) {
    this.store = new PolymerSheetStore(mergeOptions(defaultPolymerSheetOptions, options))
    this.widgets = Widgets.map(C => new C(this))
    this.render = throttle(50, this.render.bind(this))
  }

  mount() {
    this.renderSkeleton()
    this.calcContainerNodeSize()
    this.widgets.forEach(w => w.mount())
  }

  render() {
    this.widgets.forEach(w => w.render())
  }

  private renderSkeleton() {
    this.containerNode = d(this.store.containerId)
    this.containerNode.append(`
			<div id="${this.rootNodeId}">
				<div id="${this.viewNodeId}">
					<table>
						<tr>
							<td class="${this.viewGridClassName}"></td>
							<td class="${this.viewGridClassName}"></td>
						</tr>
						<tr>
							<td class="${this.viewGridClassName}"></td>
							<td class="${this.viewGridClassName}"></td>
						</tr>
					</table>
				</div>
			</div>
		`)

    this.rootNode = this.containerNode.find(`#${this.rootNodeId}`)
    this.viewNode = this.containerNode.find(`#${this.viewNodeId}`)
    this.viewGridNodes = this.containerNode.findAll(`.${this.viewGridClassName}`)
  }

  calcContainerNodeSize() {
    this.store.calcContainerNodeSize(this.containerNode.width(), this.containerNode.height())
  }

  /**
	 * 插入行
	 * @param start 要添加的首行的行号，从 0 开始
	 * @param len 行数
	 */
  insertRows(start: number, len = 1) {
    const worksheet = this.store.worksheet
    const columnLen = worksheet.cells[0].length
    const newRows = Array.from({ length: len }).map(() => {
      return Array.from({ length: columnLen }).map(() => ({} as Cell))
    })
    this.store.insertRowsIntoWorksheet(start, newRows)
    this.store.calcWorksheetSize()
  }
}
