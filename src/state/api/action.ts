import { createAction } from '../core'

export function action(arg1?: any, arg2?: any, arg3?: any): any {
  // action(fn)
  if (arguments.length === 1 && typeof arg1 === 'function') {
    return createAction(arg1.name || 'unnamed action', arg1)
  }

  // action('name', fn)
  if (arguments.length === 2 && typeof arg2 === 'function') {
    return createAction(arg1, arg2)
  }

  // @action fn = () => {}
  if (arguments.length === 3) {
    if(arg3.initializer) {
      return {
        configurable: false,
        enumerable: true,
        writable: true,
        initializer: function() {
          return createAction(arg2, arg3.initializer.call(this))
        }
      }
    }

    // @action fn() {}
    return {
      configurable: false,
      enumerable: true,
      writable: true,
      value: createAction(arg2, arg3.value)
    }
  }
}
