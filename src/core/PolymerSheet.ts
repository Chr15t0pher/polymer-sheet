import store from './Store'
import Content from './Content'
import ToolBar from './ToolBar'
import BottomBar from './BottomBar'
import { merge, d } from '../utils'
import './index.styl'

export class PolymerSheet {
  store = store

  toolbar!: ToolBar

  content!: Content

  bottomBar!: BottomBar

  constructor(options: PolymerSheetOptions) {
    this.store = merge(this.store, options)
    this.toolbar = new ToolBar(this)
    this.content = new Content(this)
    this.bottomBar = new BottomBar()
  }

  mount() {
    const container = d(this.store.containerId)
    const ContainerHeight = container.height()
    const ContainerWidth = container.width()
    this.store.contentWidth = ContainerWidth - this.store.rowHeaderWidth
    this.store.contentHeight = ContainerHeight - (this.store.toolbarHeight + this.store.columnHeaderHeight + this.store.bottomBarHeight)
  }

  render() {
    this.toolbar.mount()
    this.content.mount()
    this.bottomBar.render()
    this.mount()
    this.renderSkeleton()
  }

  renderSkeleton() {
    const container = d(this.store.containerId)
    const ContainerHeight = container.height()
    const ContainerWidth = container.width()
    container.append (`
      <div id="polymersheet" style="width: ${ContainerWidth}px; height: ${ContainerHeight}px">
        <div id="polymersheet__toolbar" style="height: ${this.store.toolbarHeight}px">
          toolbar
        </div>
        <div id="polymersheet__content">
          <canvas id="polymersheet__canvas"></canvas>
          <table>
            <tr>
              <td class="polymersheet__content_grid">
                <div class="polymersheet__space" style="width: ${this.store.rowHeaderWidth}px; height: ${this.store.columnHeaderHeight}px;">空</div>
              </td>
              <td class="polymersheet__content_grid">
                <div class="polymersheet__col_header" style="width: ${this.store.contentWidth}px; height: ${this.store.columnHeaderHeight}px; ">列</div>
              </td>
            </tr>
            <tr>
              <td class="polymersheet__content_grid">
                <div class="polymersheet__column_header" style="width: ${this.store.rowHeaderWidth}px; height: ${this.store.contentHeight}px">行</div>
              </td>
              <td class="polymersheet__content_grid">
                <div class="polymersheet__scrollbar polymersheet__scrollbar-vertical">
                  <div></div>
                </div>
                <div class="polymersheet__scrollbar polymersheet__scrollbar-horizontal">
                  <div></div>
                </div>
                <div class="polymersheet__content_overlay" style="width: ${this.store.contentWidth}px; height: ${this.store.contentHeight}px">content</div>
              </td>
            </tr>
          </table>
        </div>
        <div id="polymersheet__bottombar">
          bottombar
        </div>
      </div>
    `)
  }
}
