import { PolymerSheet } from './core'
import { greet, OperationType } from '../shared/wasm/pkg'

if (window) {
  window.PolymerSheet = PolymerSheet
}

const res = greet(OperationType.Insert)
console.log(res)

export default PolymerSheet

export {
  PolymerSheet
}
