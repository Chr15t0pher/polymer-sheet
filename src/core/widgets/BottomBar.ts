import { Widget } from './Widget'

export default class BottomBar extends Widget {
  private readonly parentNodeSelector = '#polymersheet'

  mount() {
    const parentNode = this.polymersheet.rootNode.find(this.parentNodeSelector)

    parentNode?.append(`
			<div id="polymersheet__bottombar" style="height: ${this.polymersheet.store.bottomBarHeight}px">
				bottom bar
			</div>
		`)
  }
}
