import { observer } from '../observer'
import { Widget } from './Widget'

@observer
export default class ToolBar extends Widget {
  mount() {
    const parentNode = this.polymersheet.containerNode
    parentNode?.prepend(`
			<div id="polymersheet__toolbar" style="height: ${this.polymersheet.store.toolbarHeight}px">
				tool bar
			</div>
		`)
  }
}
