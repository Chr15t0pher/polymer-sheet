import { Widget } from './Widget'

export default class BottomBar extends Widget {
  mount() {
    const parentNode = this.polymersheet.containerNode
    parentNode?.append(`
			<div id="polymersheet__bottombar" style="height: ${this.polymersheet.store.bottomBarHeight}px">
				bottom bar
			</div>
		`)
  }
}
