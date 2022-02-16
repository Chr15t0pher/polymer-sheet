/* eslint-disable prefer-spread */
import {
  isObject,
  isStringish,
  isMap,
  isSet,
} from '../utils'

import {
  isObservable,
  deepDecorator,
  observableFactories
} from '../core'

function createObservable(v: any, arg2?: any, arg3?: any) {
  // @observable prop
  if (isStringish(arg2)) {
    return deepDecorator.apply(null, arguments as any)
  }

  if (isObservable(v)) {
    return v
  }

  if (Array.isArray(v)) {
    return observable.array(v, arg2)
  }

  if (isObject(v)) {
    return observable.object(v, arg2, arg3)
  }

  if (isMap(v)) {
    return observable.map(v, arg2)
  }

  if (isSet(v)) {
    return observable.set(v, arg2)
  }

  // ignore other object type
  if (v !== null && typeof v === 'object') return v

  return observable.box(v)
}

export const observable = Object.assign(createObservable, observableFactories)
