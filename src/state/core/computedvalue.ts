import type { IDerivation } from './derivation'
import type { IEqualComparer, IBabelDescriptor } from '../utils'

import { BaseObservable } from './baseobservable'
import { createPropDecorator } from './observable'

import { asObservableObject } from './observableobject'

import { trackDerivedFunction } from './derivation'

import { createAction } from './action'

import { globalState, getNextId, startBatch, endBatch, reportChanged, reportObserved } from './globalstate'

import { comparer } from '../utils'

export type IComputedOptions<T = any> = {
  get?: () => T
  set?: (val: T) => void
  context?: any
  name?: string
  equals?: IEqualComparer<T>
}

export class ComputedValue<T = any> extends BaseObservable implements IDerivation {
  diffValue = 0

  observers = new Set<IDerivation>()

  newObserving: BaseObservable[] = []

  observing: BaseObservable[] = []

  depsUnboundCount = 0

  isComputing = false

  derivation!: () => T

  setter?: (val: T) => void

  scope: Record<PropertyKey, unknown>

  equals!: IEqualComparer<T>

  protected value!: T

  isRunningSetter = false

  constructor(options: IComputedOptions<T>) {
    super(options.name || 'ComputeValue@' + getNextId())
    if (options.set) this.setter = createAction(this.name + '-setter', options.set)
    this.derivation = options.get!
    this.scope = options.context
    this.equals = options.equals || comparer.default
  }

  onOutdated() {
    reportChanged(this)
  }

  get() {
    if (this.isComputing) throw new Error(`Cycle detected in computation ${this.name}: ${this.derivation}`)
    if (globalState.inBatch === 0 && this.observers.size === 0) {
      this.value = this.computeValue(false)
    } else {
      reportObserved(this)
      startBatch()
      if (this.trackAndCompute()) reportChanged(this)
      endBatch()
    }
    return this.value
  }

  set(newValue: any) {
    if (this.setter) {
      this.isRunningSetter = true
      this.setter.call(this.scope, newValue)
      this.isRunningSetter = false
    }
  }

  trackAndCompute() {
    const oldValue = this.value
    const newValue = this.computeValue(true)

    const changed = !this.equals(oldValue, newValue)

    if (changed) {
      this.value = newValue
    }

    return changed
  }

  computeValue(track: boolean) {
    this.isComputing = true
    globalState.computationDepth++
    let res
    if (track) {
      res = trackDerivedFunction(this, this.derivation, this.scope)
    } else {
      res = this.derivation.call(this.scope)
    }
    globalState.computationDepth--
    this.isComputing = false

    return res
  }
}

export const computedDecorator = createPropDecorator(
  (instance: any, decoratorProp: PropertyKey, descriptor: IBabelDescriptor) => {
    const { get, set } = descriptor
    asObservableObject(instance).addComputedProperty(instance, decoratorProp, { get, set, context: instance })
  }
)
