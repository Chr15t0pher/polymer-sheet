import { Widget } from './Widget'

export default class ToolBar extends Widget {
  private readonly parentNodeSelector = '#polymersheet'

  mount() {
    const parentNode = this.polymersheet.rootNode.find(this.parentNodeSelector)

    parentNode?.prepend(`
			<div id="polymersheet__toolbar" style="height: ${this.polymersheet.store.toolbarHeight}px">
				tool bar
			</div>
		`)
  }
}
