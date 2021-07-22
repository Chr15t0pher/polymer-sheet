import store from './Store'
import Content from './Content'
import ToolBar from './ToolBar'
import BottomBar from './BottomBar'
import { merge } from '../utils'
import './index.styl'

export class PolymerSheet {
  store = store

  toolbar!: ToolBar

  content!: Content

  bottomBar!: BottomBar

  constructor(options: PolymerSheetOptions) {
    this.store = merge(this.store, options)
    this.toolbar = new ToolBar(this)
    this.content = new Content()
    this.bottomBar = new BottomBar()
  }

  render() {
    this.renderSkeleton()
    this.toolbar.render()
    this.content.render()
    this.bottomBar.render()
  }

  renderSkeleton() {
    const container = document.querySelector(this.store.containerId)
    if (container) {
      container.innerHTML = `
      <div id="polymersheet">
        <div id="polymersheet__toolbar">
          toolbar
        </div>
        <div id="polymersheet__content">
          <table>
            <tr>
              <td>空白格</td>
              <td>列号</td>
            </tr>
            <tr>
              <td>行号</td>
              <td>
                <canvas></canvas>
              </td>
            </tr>
          </table>
        </div>
        <div id="polymersheet__bottombar">
          bottombar
        </div>
      </div>
      `
    } else {
      console.error('can not find spreadsheet container')
    }
  }
}
