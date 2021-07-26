import { d } from '../utils'
import type { PolymerSheet } from './PolymerSheet'

export default class Content {
  containerId = '#polymersheet__content'

  constructor(private polymersheet: PolymerSheet) {
  }

  mount() {
    console.info()
  }

  render() {
    console.info('content')
  }
}