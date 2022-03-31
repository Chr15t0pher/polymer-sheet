import type { IComputedOptions } from './computedvalue'
import type { IEnhancer } from './modifiers'
import type { IPlainObject } from '../utils'
import type { CreateObservableOptions } from '../core'
import {
  referenceEnhancer,
  deepEnhancer,
} from './modifiers'

import {
  isObject,
  hasProp,
  addHiddenProp,
  wrapInstanceWithPredicate,
  getDescriptors,
  ownKeys,
} from '../utils'
import { getNextId, startBatch, endBatch, globalState } from './globalstate'
import {
  didRunLazyInitializerSymbol,
  getEnhancerFromOptions,
} from './observable'
import { BaseObservable, $obs } from './baseobservable'
import { ObservableValue } from './observablevalue'
import { ComputedValue, computedDecorator } from './computedvalue'

export function asObservableObject(target: any, name='', defaultEnhancer = deepEnhancer): ObservableObjectAdministration {
  if (hasProp(target, $obs)) return target[$obs]
  if (isObject(target) || !name) {
    name = 'ObservableObject@' + getNextId()
  }
  const adm = new ObservableObjectAdministration(target, new Map(), name, defaultEnhancer)
  addHiddenProp(target, $obs, adm)
  return adm
}

export type IObservableObject = {
  [$obs]: ObservableObjectAdministration
}

export class ObservableObjectAdministration {
  keysAtom: BaseObservable
  pendingKeys: Map<PropertyKey, ObservableValue<boolean>> = new Map()

  constructor(
    public target: any,
    public values: Map<PropertyKey, ObservableValue | ComputedValue>,
    public name: string,
    public defaultEnhancer: IEnhancer<any>
  ) {
    this.keysAtom = new BaseObservable(name + '.keys')
  }

  get_(propName: PropertyKey) {
    return this.values.get(propName)?.get()
  }

  set_(propName: PropertyKey, newValue: any) {
    const observable = this.values.get(propName)
    if (observable instanceof ComputedValue) {
      observable.set(newValue)
      return
    }
    const val = observable?.prepareNewValue(newValue)
    if (val !== globalState.UNCHANGED) {
      observable?.setNewValue(val)
    }
  }

  has_(propName: PropertyKey) {
    const map = this.pendingKeys
    let entry = map.get(propName)
    if (entry) return entry.get()
    else {
      const exist = !!this.values.get(propName)
      entry = new ObservableValue(
        exist,
        `${this.name}.${propName.toString()}`,
        referenceEnhancer,
      )
      map.set(propName, entry)
      return entry.get()
    }
  }

  remove_(propName: PropertyKey) {
    if (!this.values.get(propName)) return
    try {
      startBatch()
      const observable = this.values.get(propName)
      observable && observable.set(undefined)
      this.keysAtom.reportChanged()
      this.values.delete(propName)
      const pending = this.pendingKeys.get(propName)
      if (pending) {
        pending.set(false)
      }
      delete this.target[propName]
    } finally {
      endBatch()
    }
  }

  ownKeys_() {
    this.keysAtom.reportObserved()
    return [...this.values.keys()]
  }

  addObservableProperty(propName: PropertyKey, newValue: any, enhancer: IEnhancer<any>) {
    const target = this.target

    const observable = new ObservableValue(
      newValue,
      `${this.name}.${String(propName)}`,
      enhancer,
    )

    this.values.set(propName, observable)
    newValue = (observable.value)

    Object.defineProperty(target, propName, generateObservablePropertyDescriptor(propName))
    this.notifyPropertyAddition(propName)
  }

  addComputedProperty<T>(instance: any, propName: PropertyKey, options: IComputedOptions<T>) {
    options.name = options.name || `${this.name}.${String(propName)}`
    this.values.set(propName, new ComputedValue(options))
    if (instance === this.target) {
      Object.defineProperty(instance, propName, generateObservablePropertyDescriptor(propName))
    }
  }

  notifyPropertyAddition(propName: PropertyKey) {
    const entry = this.pendingKeys.get(propName)
    if (entry) entry.set(true)
    this.keysAtom.reportChanged()
  }
}

const isObservableObjectAdministration = wrapInstanceWithPredicate(
  'ObservableObjectAdministration',
  ObservableObjectAdministration,
)

export function isObservableObject(value: any) {
  if (isObject(value)) {
    return isObservableObjectAdministration(value[$obs])
  }

  return false
}


function generateObservablePropertyDescriptor(propName: PropertyKey): PropertyDescriptor {
  return {
    configurable: false,
    enumerable: false,
    get(this: any) {
      return this[$obs].get_(propName)
    },
    set(this: any, value: any) {
      this[$obs].set_(propName, value)
    }
  }
}

function getAdm(target: IObservableObject) {
  return target[$obs]
}

const handlers: ProxyHandler<any> = {
  has(target: IObservableObject, propName: PropertyKey) {
    if (propName === $obs || propName === 'constructor' || propName === didRunLazyInitializerSymbol) {
      return true
    }

    if (typeof propName === 'string') getAdm(target).has_(propName)

    return propName in target
  },
  get(target: IObservableObject, propName: PropertyKey) {
    if (propName === $obs || propName === 'constructor' || propName === didRunLazyInitializerSymbol) {
      return (target as any)[propName]
    }
    const adm = getAdm(target)
    const observable = adm.values.get(propName)
    if (observable instanceof BaseObservable) {
      return observable.get()
    }
    if (typeof propName === 'string') adm.has_(propName)
    return getAdm(target).get_(propName as string)
  },
  set(target: IObservableObject, propName: PropertyKey, value: any) {
    if (typeof propName !== 'string') return false
    const adm = getAdm(target)
    const exist = adm.values.get(propName)
    if (exist) {
      adm.set_(propName, value)
    } else {
      adm.addObservableProperty(propName, value, adm.defaultEnhancer)
    }

    return true
  },
  deleteProperty(target: IObservableObject, propName: PropertyKey) {
    if (typeof propName !== 'string') return false
    getAdm(target).remove_(propName)
    return true
  },
  ownKeys(target: IObservableObject) {
    return (getAdm(target).ownKeys_()) as ArrayLike<symbol | string>
  }
}

export function createObservableObject<T extends IPlainObject>(target: T, options: CreateObservableOptions) {
  const enhancer = getEnhancerFromOptions(options)
  asObservableObject(target, options.name, enhancer)
  const proxy = new Proxy(target, handlers)
  return proxy
}

export function extendObservable<T extends IPlainObject, F extends IPlainObject>(target: T, props: F, decorators?: { [K in keyof T]: (...args: any[])=> void }, defaultDecorator?: (...args: any[]) => void) {
  const descriptors = getDescriptors(props)
  ownKeys(descriptors).forEach(propName => {
    const descriptor = descriptors[propName]
    const decorator = (decorators && propName in decorators
      ? decorators[propName]
      : descriptor.get
        ? computedDecorator
        : defaultDecorator) as (...args: any[]) => TypedPropertyDescriptor<any>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const resultDescriptor = decorator!(target, propName, descriptor, true)
    if (resultDescriptor) {
      Object.defineProperty(target, propName, resultDescriptor)
    }
  })
}
