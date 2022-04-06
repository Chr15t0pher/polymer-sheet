import type { IDerivation } from './derivation'
import type { IEnhancer } from './modifiers'
import { IEqualComparer } from '../utils'

import { ObservableState } from './types-utils'
import { wrapInstanceWithPredicate } from '../utils'

import { startBatch, endBatch, reportChanged, reportObserved } from './globalstate'

export const $obs = Symbol('observable administration')

export class BaseObservable {
  observableState = ObservableState.notTracking

  lastAccessedBy = 0

  diffValue = 0

  observers = new Set<IDerivation>()

  constructor(
    public name: string
  ) {
  }

  reportChanged() {
    startBatch()
    reportChanged(this)
    endBatch()
  }

  reportObserved() {
    return reportObserved(this)
  }
}

export type IObservableDecorator<T = any> = {
  (target: Record<string, unknown>, propName: string, descriptor: TypedPropertyDescriptor<T>): void,
  enhancer: IEnhancer<T>
}

export interface CreateObservableOptions {
  name?: string
  equals?: IEqualComparer<any>
  deep?: boolean
  defaultDecorator?: IObservableDecorator
}

export const defaultCreateObservableOptions: CreateObservableOptions = {
  name: undefined,
  deep: true
}

export function asCreateObservableOptions(options?: CreateObservableOptions) {
  return options || defaultCreateObservableOptions
}

export const isBaseObservable = wrapInstanceWithPredicate('BaseObservable', BaseObservable)
