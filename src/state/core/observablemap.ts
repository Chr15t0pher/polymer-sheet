import type { IEnhancer } from './modifiers'
import type { IChangeInfo, IChangeListener } from './change'

import { BaseObservable, $obs } from './baseobservable'

import { untracked, transaction } from './action'

import { deepEnhancer } from './modifiers'

import { globalState, getNextId } from './globalstate'

import { ObservableValue } from './observablevalue'

import { wrapInstanceWithPredicate, makeIterable } from '../utils'
import { changeSubjectType, changeType, hasListener, IListenable, notifyListeners, registerListener } from './change'


const observableMarker = {}

export type IObservableMapChangeListener<K, V> = IChangeListener<ObservableMap<K, V>>

export class ObservableMap<K, V> implements Map<K, V>, IListenable<ObservableMap<K, V>, K, V> {
  [$obs] = observableMarker
  keysAtom: BaseObservable
  changeListeners: Set<IChangeListener<ObservableMap<K, V>, K, V>> = new Set()
  readonly values_: Map<K, ObservableValue<V>> = new Map()
  readonly hasMap_: Map<K, ObservableValue<boolean>> = new Map()

  constructor(
    initialData: Map<K, V>,
    private enhancer: IEnhancer<any> = deepEnhancer,
    public name = 'ObservableMap@' + getNextId()
  ) {
    this.keysAtom = new BaseObservable(this.name + '.keys()')
    transaction(() => {
      initialData.forEach((value, key) => {
        this.set(key, value)
      })
    })
  }

  clear() {
    transaction(() => {
      untracked(() => {
        for (const key of this.keys()) this.delete(key)
      })
    })
  }

  delete(key: K) {
    if(this.has(key)) {
      transaction(() => {
        this.updateHasMapEntry(key, false)
        const observable = this.values_.get(key)
        const prev = observable?.get()
        observable?.set(undefined as any)
        this.values_.delete(key)
        this.keysAtom.reportChanged()
        const needNotify = hasListener(this)
        if (needNotify) {
          untracked(() => {
            const change: IChangeInfo<ObservableMap<K, V>> = {
              subjectType: changeSubjectType.map,
              subjectName: this.name,
              subject: this,
              name: key,
              type: changeType.DELETE,
              prev,
              next: undefined,
            }
            notifyListeners(this, change)
          })
        }
      })
    }

    return false
  }

  has(key: K): boolean {
    if (!globalState.trackingDerivation) return this.has_(key)

    let entry = this.hasMap_.get(key)
    if (!entry) {
      entry = new ObservableValue(
        this.has_(key),
        this.name + '.' + new String(key).toString(),
        this.enhancer,
      )
      this.hasMap_.set(key, entry)
    }
    return entry.get()
  }

  get(key: K) {
    this.keysAtom.reportObserved()
    if (this.values_.has(key)) return this.values_.get(key)?.get()
  }

  set(key: K, newValue: V) {
    if (this.has(key)) {
      // update value
      transaction(() => {
        const observable = this.values_.get(key)!
        const prev = observable.get()

        const val = observable.prepareNewValue(newValue)
        if (val !== globalState.UNCHANGED) {
          observable.setNewValue(val)
          if (hasListener(this)) {
            untracked(() => {
              const change: IChangeInfo<ObservableMap<K, V>> = {
                subjectType: changeSubjectType.map,
                subjectName: this.name,
                subject: this,
                name: key,
                type: changeType.UPDATE,
                prev,
                next: newValue
              }
              notifyListeners(this, change)
            })
          }
        }
      })
    } else {
      // add new value
      transaction(() => {
        const value = new ObservableValue(newValue, this.name + new String(key).toString(), this.enhancer)
        this.values_.set(key, value)
        this.updateHasMapEntry(key, true)
        this.keysAtom.reportChanged()
        if (hasListener(this)) {
          untracked(() => {
            const change: IChangeInfo<ObservableMap<K, V>> = {
              subjectType: changeSubjectType.map,
              subjectName: this.name,
              subject: this,
              name: key,
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

  get size() {
    this.keysAtom.reportObserved()
    return this.values_.size
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    for (const [key, value] of this) {
      callbackfn.call(thisArg, value, key, this)
    }
  }

  keys() {
    this.keysAtom.reportObserved()
    return this.values_.keys()
  }

  values() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const keys = this.values_.keys()
    return makeIterable({
      next() {
        const { value: key, done } = keys.next()
        return { done, value: done ? undefined : self.get(key) }
      }
    })
  }

  entries() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const keys = this.values_.keys()
    return makeIterable({
      next() {
        const { value: key, done } = keys.next()
        return { done, value: done ? undefined : [key, self.get(key)]}
      }
    })
  }

  observe(listener:IObservableMapChangeListener<K, V>) {
    return registerListener(this, listener)
  }


  [Symbol.iterator]() { return this.entries() }

  [Symbol.toStringTag] = 'Map'

  private has_(key: K) {
    return this.values_.has(key)
  }

  private updateHasMapEntry(key: K, value: boolean) {
    const entry = this.hasMap_.get(key)
    if (entry) {
      entry.set(value)
    }
  }
}

export const isObservableMap = wrapInstanceWithPredicate(
  'ObservableMap',
  ObservableMap
)
