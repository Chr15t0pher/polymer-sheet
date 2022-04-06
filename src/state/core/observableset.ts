import type { IEnhancer } from './modifiers'
import type { CreateObservableOptions } from './baseobservable'
import type { IChangeListener } from './change'

import { getEnhancerFromOptions } from './observable'
import { changeSubjectType, changeType, hasListener, IChangeInfo, IListenable, notifyListeners, registerListener } from './change'
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

export type IObservableSetChangeListener = IChangeListener<ObservableSet>
export class ObservableSet<T = any> implements Set<T>, IListenable<ObservableSet> {
  [$obs] = observableMarker
  atom: BaseObservable
  changeListeners: Set<IChangeListener<ObservableSet<any>, any, any>> = new Set()
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
        if (hasListener(this)) {
          untracked(() => {
            const change: IChangeInfo<ObservableSet<T>> = {
              subjectType: changeSubjectType.set,
              subjectName: this.name,
              subject: this,
              name: newValue,
              type: changeType.ADD,
              prev: undefined,
              next: newValue
            }
            notifyListeners(this, change)
          })
        }
      })
    }
    return this
  }

  delete(value: T) {
    if (this.has(value)) {
      transaction(() => {
        this.atom.reportChanged()
        this.values_.delete(value)
        if (hasListener(this)) {
          untracked(() => {
            const change: IChangeInfo<ObservableSet<T>> = {
              subjectType: changeSubjectType.set,
              subjectName: this.name,
              subject: this,
              name: value,
              type: changeType.DELETE,
              prev: value,
              next: undefined
            }
            notifyListeners(this, change)
          })
        }
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

  observe(listener: IObservableSetChangeListener) {
    return registerListener(this, listener)
  }
}

export const isObservableSet = wrapInstanceWithPredicate(
  'ObservableSet',
  ObservableSet
)

export function createObservableSet<T>(set: Set<T>, options?: CreateObservableOptions) {
  const o = asCreateObservableOptions(options)
  return new ObservableValue(set, o.name, getEnhancerFromOptions(o), o.equals)
}
