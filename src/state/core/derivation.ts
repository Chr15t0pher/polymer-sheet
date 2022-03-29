import type { BaseObservable } from './baseobservable'

import { globalState } from './globalstate'

export interface IDerivation {
  newObserving: BaseObservable[]
  observing: BaseObservable[]
  depsUnboundCount: number
  onOutdated: () => void
}

export function trackDerivedFunction<T>(derivation: IDerivation, f: () => T, ctx: any) {
  derivation.depsUnboundCount = 0
  const prevTracking = globalState.trackingDerivation
  globalState.trackingDerivation = derivation
  const res = f.call(ctx)
  globalState.trackingDerivation = prevTracking
  bindDependencies(derivation)
  return res
}

function bindDependencies(derivation: IDerivation) {
  const prevObserving = derivation.observing
  const observing = derivation.observing = derivation.newObserving

  let i0 = 0
  let l = derivation.depsUnboundCount
  for(let i = 0; i < l; i++) {
    const dep = observing[i]
    if (dep.diffValue === 0) {
      dep.diffValue = 1
      if (i0 !== i) {
        observing[i0] = dep
      }
      i0++
    }
  }

  observing.length = i0

  derivation.newObserving = []

  l = prevObserving.length
  while(l--) {
    const dep = prevObserving[l]
    if (dep.diffValue === 0) {
      removeObserver(dep, derivation)
    }
    dep.diffValue = 0
  }

  while(i0--) {
    const dep = observing[i0]
    if (dep.diffValue === 1) {
      dep.diffValue = 0
      addObserver(dep, derivation)
    }
  }
}

export function removeObserver(observable: BaseObservable, derivation: IDerivation) {
  observable.observers.delete(derivation)
}

export function addObserver(observable: BaseObservable, derivation: IDerivation) {
  observable.observers.add(derivation)
}
