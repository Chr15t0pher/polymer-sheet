import type { PolymerSheet } from './PolymerSheet'
export default class BottomBar {
  containerId = '#polymersheet__bottombar'

  constructor(private polymersheet: PolymerSheet) {}

  mount() {
    console.info('mount')
  }

  render() {
    console.info('content')
  }
}
