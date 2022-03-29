import type { IEnhancer } from './modifiers'
import type { CreateObservableOptions } from './baseobservable'

import { getEnhancerFromOptions } from './observable'

import { BaseObservable, $obs, asCreateObservableOptions } from './baseobservable'
import { deepEnhancer } from './modifiers'
import { getNextId } from './globalstate'
import {
  makeIterable,
  wrapInstanceWithPredicate,
} from '../utils'

import { untracked, transaction } from './action'
import { ObservableValue } from './observablevalue'

const observableMarker = {}

export class ObservableSet<T = any> implements Set<T> {
  [$obs] = observableMarker
  atom: BaseObservable
  readonly values_ = new Set<T>()

  constructor(
    initialData: Set<T>,
    private enhancer: IEnhancer<any> = deepEnhancer,
    public name = 'ObservableSet@' + getNextId(),
  ) {
    this.atom = new BaseObservable(this.name)
    transaction(() => {
      Array.from(initialData).forEach((value) => {
        this.add(value)
      })
    })
  }

  get size() {
    this.atom.reportObserved()
    return this.values_.size
  }

  clear() {
    transaction(() => {
      untracked(() => {
        for (const value of this.values()) this.delete(value)
      })
    })
  }

  add(newValue: T) {
    if (!this.has(newValue)) {
      transaction(() => {
        this.atom.reportChanged()
        this.values_.add(this.enhancer(newValue))
      })
    }
    return this
  }

  delete(value: T) {
    if (this.has(value)) {
      transaction(() => {
        this.atom.reportChanged()
        this.values_.delete(value)
      })
      return true
    }
    return false
  }

  has(value: T): boolean {
    this.atom.reportObserved()
    return this.values_.has(value)
  }

  entries() {
    let nextIndex = 0
    const keys = Array.from(this.keys())
    const values = Array.from(this.values())
    return makeIterable({
      next() {
        const index = nextIndex
        nextIndex += 1
        return index < values.length ? { value: [keys[index], values[index]], done: false } : { value: undefined, done: true }
      }
    })
  }

  keys() {
    return this.values()
  }

  values() {
    this.atom.reportObserved()
    const size = this.values_.size
    const data = Array.from(this.values_)
    let nextIndex = 0
    return makeIterable({
      next() {
        const index = nextIndex
        nextIndex += 1
        return index < size ? { value: data[index], done: false } : { done: true, value: undefined }
      }
    })
  }

  forEach(callbackfn: (value: T, key: T, set: Set<T>) => void, thisArg?: any): void {
    for (const value of this) {
      callbackfn.call(thisArg, value, value, this)
    }
  }

  [Symbol.iterator]() {
    return this.values()
  }

  [Symbol.toStringTag] = 'Set'
}

export const isObservableSet = wrapInstanceWithPredicate(
  'ObservableSet',
  ObservableSet
)

export function createObservableSet<T>(set: Set<T>, options?: CreateObservableOptions) {
  const o = asCreateObservableOptions(options)
  return new ObservableValue(set, o.name, getEnhancerFromOptions(o), o.equals)
}
