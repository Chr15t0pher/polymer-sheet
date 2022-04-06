import type { IEnhancer } from './modifiers'

import { changeSubjectType, changeType, hasListener, IChangeListener, IListenable, registerListener, notifyListeners, IChangeInfo } from './change'
import { $obs, BaseObservable } from './baseobservable'
import { getNextId } from './globalstate'
import {
  addHiddenProp,
  wrapInstanceWithPredicate,
  EMPTY_ARRAY,
  isObject,
  throwError,
  ErrorType,
  hasProp
} from '../utils'
import { untracked } from './action'

export interface IObservableArray<T = any> extends Array<T>{
  [$obs]: ObservableArrayAdministration
}

export type IObservableArrayChangeListener = IChangeListener<IObservableArray>
export class ObservableArrayAdministration implements IListenable<IObservableArray> {
  atom: BaseObservable
  readonly values: any[] = []
  changeListeners: Set<IChangeListener<IObservableArray>> = new Set()

  constructor(
    public name: string,
    public enhancer: IEnhancer<any>,
  ) {
    this.atom = new BaseObservable(name)
  }

  getArrayLength() {
    this.atom.reportObserved()
    return this.values.length
  }

  setArrayLength(newLen: number) {
    if (typeof newLen !== 'number' || newLen < 0) {
      // throw error
    }
    const currentLen = this.values.length
    if (newLen === currentLen) return
    else if (newLen > currentLen) {
      const newItems = Array.from({ length: newLen - currentLen }).fill(undefined)
      this.spliceWithNewItems(currentLen, 0, newItems)
    } else {
      this.spliceWithNewItems(newLen, currentLen - newLen)
    }
  }

  spliceWithNewItems(start: number, delCount?: number, newItems?: any[]) {
    const length = this.values.length
    const prev = this.values.slice()

    if (start === undefined || start === null) start = 0
    else if (start < 0) start = length - start
    else if (start > length) start = length

    if (arguments.length === 1) delCount = length - start
    else if (delCount === undefined || delCount === null) delCount = 0
    else delCount = Math.max(0, Math.min(length - start, delCount))

    if (newItems === undefined) newItems = EMPTY_ARRAY

    newItems = newItems!.map((item) => this.enhancer(item))

    const res = this.values.splice(start, delCount, ...newItems)
    if (delCount > 0 || newItems.length > 0) {
      this.atom.reportChanged()
      if (hasListener(this)) {
        untracked(() => {
          const change: IChangeInfo<IObservableArray> = {
            subjectType: changeSubjectType.array,
            subjectName: this.name,
            subject: this.values as IObservableArray,
            name: this.name,
            type: changeType.UPDATE,
            prev,
            next: this.values.slice()
          }
          notifyListeners(this, change)
        })
      }
    }
    return res
  }

  get(index: number) {
    if (index < this.values.length) {
      this.atom.reportObserved()
      return this.values[index]
    }
    throwError(ErrorType.outOfBound, index, this.values.length)
  }

  set(index: number, newVal: any) {
    const currentLen = this.values.length
    if (index < currentLen) {
      const oldVal = this.values[index]
      newVal = this.enhancer(newVal)

      if (newVal !== oldVal) {
        this.values[index] = newVal
        this.atom.reportChanged()
      }
    } else if (index === currentLen) {
      this.spliceWithNewItems(index, 0, [newVal])
    } else {
      throwError(ErrorType.outOfBound, index, currentLen)
    }
  }

  observe(listener: IObservableArrayChangeListener) {
    return registerListener(this, listener)
  }
}

const isObservableArrayAdministration = wrapInstanceWithPredicate(
  'ObservableArrayAdministration',
  ObservableArrayAdministration
)

export function isObservableArray(value: any[]): value is IObservableArray<any> {
  if (isObject(value)) {
    // @ts-ignore
    return isObservableArrayAdministration(value[$obs])
  }
  return false
}

const extensions = {
  splice(this: IObservableArray, start: number, delCount?: number, ...newItems: any[]) {
    const adm = this[$obs]
    if (arguments.length === 0) {
      return []
    }
    return adm.spliceWithNewItems(start, delCount, newItems)
  },
  push(this: IObservableArray, ...newItems: any[]) {
    const adm = this[$obs]
    adm.spliceWithNewItems(adm.values.length, 0, newItems)
    return adm.values.length
  },
  pop(this: IObservableArray) {
    const adm = this[$obs]
    return adm.spliceWithNewItems(Math.max(adm.values.length - 1, 0), 1)[0]
  },
  shift(this: IObservableArray) {
    return this.splice(0, 1)[0]
  },
  reverse(this: IObservableArray) {
    // different from default Array.prototype.reverse, it cannot make side effect
    const clone = this.slice()
    return clone.reverse.call(clone)
  },
  sort(this: IObservableArray, sortFn: (a: any, b: any) => number) {
    const clone = this.slice()
    return clone.sort.call(clone, sortFn)
  }
}

const handlers = {
  get: function(target: any[], propName: any) {
    // @ts-ignore
    const adm: ObservableArrayAdministration = target[$obs]
    if (propName === $obs) return adm
    if (propName === 'length') return adm.getArrayLength()
    if (hasProp(extensions, propName)) return extensions[propName]
    if (typeof propName === 'string' && !isNaN(propName as any)) {
      return adm.get(parseInt(propName))
    }

    return target[propName]
  },
  set: function(target: any[], propName: string, val: any) {
    // @ts-ignore
    const adm: ObservableArrayAdministration = target[$obs]
    if (propName === 'length') {
      adm.setArrayLength(val)
    }
    // @ts-ignore
    if (isNaN(propName) || typeof propName === 'symbol') {
      // @ts-ignore
      target[propName] = val
    } else {
      Reflect.set(adm.values, propName, val)
      adm.set(parseInt(propName), val)
    }

    return true
  },
}

export function createObservableArray<T>(initialValues: T[], enhancer: IEnhancer<T>, name = 'ObservableArray@' + getNextId()) {
  if (isObservableArray(initialValues)) return initialValues
  const adm = new ObservableArrayAdministration(name, enhancer)
  addHiddenProp(adm.values, $obs, adm)
  const proxy = new Proxy(adm.values, handlers) as any
  adm.spliceWithNewItems(0, 0, initialValues)
  return proxy
}
