import type { IDerivation } from './derivation'
import { IEqualComparer, IBabelDescriptor, wrapInstanceWithPredicate, throwError, ErrorType } from '../utils'

import { BaseObservable } from './baseobservable'
import { createPropDecorator } from './observable'
import { asObservableObject } from './observableobject'
import { trackDerivedFunction, shouldReconcile } from './derivation'
import { createAction, untracked } from './action'
import { ObservableState } from './types-utils'
import {
  globalState,
  getNextId,
  startBatch,
  endBatch,
  reportConfirmChanged,
  reportPossiblyChanged,
  reportObserved
} from './globalstate'

import { comparer } from '../utils'
import { hasListener, IChangeInfo, IChangeListener, IListenable, notifyListeners, registerListener, changeType, changeSubjectType } from './change'

export type IComputedOptions<T = any> = {
  get?: () => T
  set?: (val: T) => void
  context?: any
  name?: string
  equals?: IEqualComparer<T>
}

export class ComputedValue<T = any> extends BaseObservable implements IDerivation, IListenable<ComputedValue> {
  /**
	* dependenciesState will be changed when it's dependencies call `reportChanged` or `reportPossiblyChanged`
	* 1. notTracking: initial phrase
	* 2. updated
	* 3. possiblyChanged: it's dependencies have included computedValue, the computedValue was called `onOutdated` by it's dependency
	* 4. outdated:
	*/
  dependenciesState = ObservableState.notTracking

  changeListeners: Set<IChangeListener<ComputedValue<any>, any, any>> = new Set()

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

  lastAccessedBy = 0

  runId = 0

  constructor(options: IComputedOptions<T>) {
    super(options.name || 'ComputeValue@' + getNextId())
    if (options.set) this.setter = createAction(this.name + '-setter', options.set)
    this.derivation = options.get!
    this.scope = options.context
    this.equals = options.equals || comparer.default
  }

  onOutdated() {
    reportPossiblyChanged(this)
  }

  get() {
    if (this.isComputing) throwError(ErrorType.cycleComputation, this.name, this.derivation)
    if (globalState.inBatch === 0 && this.observers.size === 0) {
      this.value = this.computeValue(false)
    } else {
      reportObserved(this)
      startBatch()
      if (shouldReconcile(this)) if (this.trackAndCompute()) reportConfirmChanged(this)
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
      if (hasListener(this)) {
        untracked(() => {
          const change: IChangeInfo<ComputedValue> = {
            subjectType: changeSubjectType.computed,
            subjectName: this.name,
            subject: this,
            name: this.name,
            type: changeType.UPDATE,
            prev: oldValue,
            next: newValue
          }
          notifyListeners(this, change)
        })
      }
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

  observe(listener: IChangeListener<ComputedValue>) {
    return registerListener(this, listener)
  }
}

export const isComputedValue = wrapInstanceWithPredicate(
  'ComputedValue',
  ComputedValue
)

export const computedDecorator = createPropDecorator(
  (instance: any, decoratorProp: PropertyKey, descriptor: IBabelDescriptor) => {
    const { get, set } = descriptor
    asObservableObject(instance).addComputedProperty(instance, decoratorProp, { get, set, context: instance })
  }
)
