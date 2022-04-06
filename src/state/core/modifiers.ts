import type { IObservableObject } from './observableobject'
import type { IObservableArray } from './observablearray'
import type { ObservableValue } from './observablevalue'
import type { ObservableMap } from './observablemap'
import type { ObservableSet } from './observableset'

import { isObservable, observableFactories } from './observable'
import { isPlainObject, isMap, isSet } from '../utils'
export interface IEnhancer<T> {
  (newValue: T, oldValue?: T , name?: string): T
}

export function deepEnhancer<K>(newValue: ObservableValue<K>, _: ObservableValue<K>, name?: string): ObservableValue<K>
export function deepEnhancer<V>(newValue: Record<PropertyKey, V>, _: Record<PropertyKey, V>, name?: string): IObservableObject
export function deepEnhancer<V>(newValue: Array<V>, _: Array<V>, name?: string): IObservableArray
export function deepEnhancer<K, V>(newValue: Map<K, V>, _: Map<K, V>, name?: string): ObservableMap<K, V>
export function deepEnhancer<V>(newValue: Set<V>, _: Set<V>, name?: string): ObservableSet<V>
export function deepEnhancer<K, V>(
  newValue: ObservableValue<K> | Record<PropertyKey, V> | Array<V> | Map<K, V> | Record<PropertyKey, unknown>,
  _: ObservableValue<K> | Record<PropertyKey, V> | Array<V> | ObservableMap<K, V> | Record<PropertyKey, unknown>,
  name?: string
) {
  if (isObservable(newValue)) return newValue

  if (Array.isArray(newValue)) return observableFactories.array(newValue, { name })

  if (isMap(newValue)) return observableFactories.map(newValue, { name })

  if (isSet(newValue)) return observableFactories.set(newValue, { name })

  if (isPlainObject(newValue)) return observableFactories.object(newValue, undefined, { name })

  return newValue
}

export function referenceEnhancer<T>(newValue: T) {
  return newValue
}
