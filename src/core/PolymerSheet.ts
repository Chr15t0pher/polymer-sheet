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
    console.info('')
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

    const cellsOverlayWidth = ContainerWidth - this.store.rowHeaderWidth
    const cellsOverlayHeight = ContainerHeight - (this.store.toolbarHeight + this.store.columnHeaderHeight + this.store.bottomBarHeight)

    const verticalScrollbarHeight = cellsOverlayHeight + this.store.columnHeaderHeight - this.store.scrollbarSize
    const horizontalScrollbarWidth = cellsOverlayWidth

    this.store.contentWidth = ContainerWidth - this.store.scrollbarSize
    this.store.contentHeight = ContainerHeight - (this.store.scrollbarSize + this.store.toolbarHeight + this.store.bottomBarHeight)

    container.append (`
      <div id="polymersheet" style="width: ${ContainerWidth}px; height: ${ContainerHeight}px">
        <div id="polymersheet__toolbar" style="height: ${this.store.toolbarHeight}px">
          toolbar
        </div>
        <div id="polymersheet__view">
          <canvas id="polymersheet__content" width="${this.store.contentWidth * this.store.devicePixelRatio}" height="${this.store.contentHeight * this.store.devicePixelRatio}" style="width: ${this.store.contentWidth}px; height: ${this.store.contentHeight}px"></canvas>
          <table>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__space" style="width: ${this.store.rowHeaderWidth}px; height: ${this.store.columnHeaderHeight}px;">空</div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__col_header" style="width: ${cellsOverlayWidth}px; height: ${this.store.columnHeaderHeight}px; ">列</div>
              </td>
            </tr>
            <tr>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__column_header" style="width: ${this.store.rowHeaderWidth}px; height: ${cellsOverlayHeight}px">行</div>
              </td>
              <td class="polymersheet__view_grid">
                <div class="polymersheet__scrollbar polymersheet__scrollbar-vertical" style="width: ${this.store.scrollbarSize}px; height: ${verticalScrollbarHeight}px; right: 0px; top: 0px;">
                  <div></div>
                </div>
                <div class="polymersheet__scrollbar polymersheet__scrollbar-horizontal" style="width: ${horizontalScrollbarWidth}px; height: ${this.store.scrollbarSize}px; right: 0px; bottom: 0px;">
                  <div></div>
                </div>
                <div class="polymersheet__cells_overlay" style="width: ${cellsOverlayWidth}px; height: ${cellsOverlayHeight}px">content</div>
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
