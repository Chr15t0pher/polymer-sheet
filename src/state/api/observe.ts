import type { IChangeListener } from '../core'
import { getAdministration } from '../core'
import { isFunction } from '../utils'

export function observe<T, K, V>(
  thing: T,
  propOrListener?: PropertyKey | IChangeListener<T, K, V>,
  listener?: IChangeListener<T, K, V>
) {
  if (isFunction(propOrListener)) {
    return getAdministration(thing).observe(propOrListener)
  }
  return getAdministration(thing, propOrListener).observe(listener)
}
