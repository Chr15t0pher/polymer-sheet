import type { BaseObservable } from './baseobservable'
import { ObservableState } from './types-utils'

import { globalState } from './globalstate'
import { untrackedEnd, untrackedStart } from './action'
import { isComputedValue } from './computedvalue'

export interface IDerivation {
  newObserving: BaseObservable[]
  observing: BaseObservable[]
  depsUnboundCount: number
  onOutdated: () => void
  dependenciesState: ObservableState
  runId: number
}

export function trackDerivedFunction<T>(derivation: IDerivation, f: () => T, ctx: any) {
  changeDependenciesStateToUpdated(derivation)
  derivation.depsUnboundCount = 0
  derivation.runId = ++globalState.runId
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
  /*
	*
	* `Reaction.track` calls `trackDerivationFunction`, then `f.call(ctx)`
	* 	triggers `ComputedValue.get` then `reportConfirmChanged`, toggle `ComputedValue`'s `observableState` to `outdated`, and toggle `Reaction`'s `dependenciesState` to `updated`
	*     come back to `Reaction.track`'s `trackDerivationFunction`, bindDependencies, need to change ComputedValue to `updated`
	*/
  if (observable.observableState > derivation.dependenciesState) {
    observable.observableState = derivation.dependenciesState
  }
}

// three condition:
// 1. ComputedValue call `shouldReconcile` when endBatch call runReactions
// 2. call ComputedValue.get()
// 3. Reaction.runReaction_()
export function shouldReconcile(derivation: IDerivation) {
  switch(derivation.dependenciesState) {
    case ObservableState.updated:
      return false
    case ObservableState.notTracking:
    case ObservableState.outdated:
      return true
    case ObservableState.possiblyOutdated: {
      const prevDerivation = untrackedStart()
      const obs = derivation.observing
      const l = obs.length
      for (let i = 0; i < l; i++) {
        const ob = obs[i]
        if (isComputedValue(ob)) {
          try {
            ob.get()
          } catch(e) {
            untrackedEnd(prevDerivation)
            return true
          }

          // @ts-ignore
          if (derivation.dependenciesState === ObservableState.outdated) {
            untrackedEnd(prevDerivation)
            return true
          }
        }
      }
      changeDependenciesStateToUpdated(derivation)
      untrackedEnd(prevDerivation)
      return false
    }
  }
}

export function changeDependenciesStateToUpdated(derivation: IDerivation) {
  if (derivation.dependenciesState === ObservableState.updated) return
  derivation.dependenciesState = ObservableState.updated

  const obs = derivation.observing
  for(let i = 0; i < obs.length; i++) {
    obs[i].observableState = ObservableState.updated
  }
}
