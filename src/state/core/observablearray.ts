import type { IEnhancer } from './modifiers'
import { $obs, BaseObservable } from './baseobservable'
import { getNextId } from './globalstate'
import {
  addHiddenProp,
  wrapInstanceWithPredicate,
  EMPTY_ARRAY,
  isObject
} from '../utils'

export interface IObservableArray<T = any> extends Array<T>{
  [$obs]: ObservableArrayAdministration
}

export class ObservableArrayAdministration {
  atom: BaseObservable
  readonly values: any[] = []

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

  spliceWithNewItems(start: number, delCount: number, newItems?: any[]) {
    const length = this.values.length
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
    }
    return res
  }

  get(index: number) {
    if (index < this.values.length) {
      this.atom.reportObserved()
      return this.values[index]
    }
    // TODO: error information: get index out of bounds of array
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
      // TODO: error information: out of bound
    }
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

const handlers = {
  get: function(target: any[], propName: any) {
    // @ts-ignore
    const adm: ObservableArrayAdministration = target[$obs]
    if (propName === $obs) return adm
    if (propName === 'length') return adm.getArrayLength()
    if (typeof propName === 'string' || !isNaN(propName)) {
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
