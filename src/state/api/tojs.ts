import type { IObservableObject } from'../core'

import {
  isObservableValue,
  isComputedValue,
  isObservableArray,
  isObservableSet,
  isObservableMap,
  isObservable,
} from '../core'

// function helper<ObservableValue<T>>(source: ObservaleValue<T>): T
function helper(source: any) {
  if (
    !isObservable(source) ||
		source === null ||
		source instanceof Date
  ) {
    return source
  }
  if (
    isObservableValue(source) ||
		isComputedValue(source)
  ) {
    return source.get()
  } else if (isObservableArray(source)) {
    const res: any[] = []
    source.forEach((val, i) => {
      res[i] = helper(val)
    })
    return res
  } else if (isObservableSet(source)) {
    const res: Set<any> = new Set()
    source.forEach((val) => {
      res.add(helper(val))
    })
    return res
  } else if (isObservableMap(source)) {
    const res: Map<any, any> = new Map()
    source.forEach((val, i) => {
      res.set(i, helper(val))
    })
    return res
  } else {
    const res: Record<string, unknown> = {}
    Reflect.ownKeys(source as IObservableObject).forEach((key) => {
      res[key as string] = helper(source[key])
    })
    return res
  }
}

export function tojs<T>(source: T) {
  if (
    !isObservable(source)
  ) {
    return source
  }

  return helper(source)
}
