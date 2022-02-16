import type { IComputedOptions } from '../core'

import { ComputedValue, computedDecorator } from '../core'
import { isStringish } from '../utils'

export function computed(arg1: any, arg2?: any) {
  if (isStringish(arg2)) {
    // @computed
    return computedDecorator.call(null, ...arguments as any)
  }

  if (arguments.length === 1 && arg1 !== null && typeof arg1 === 'object') {
    // @computed({ options })
    return computedDecorator.call(null, ...arguments as any)
  }

  // computed(getter, options?)
  const options: IComputedOptions = typeof arg2 === 'object' ? arg2 : {}
  options.get = arg1
  options.set = typeof arg2 === 'function' ? arg2 : options.set
  return new ComputedValue(options)
}
