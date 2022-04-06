import type { IDerivation } from './derivation'
import type { BaseObservable } from './baseobservable'
import type { Reaction } from'./reaction'
import type { ComputedValue } from './computedvalue'
import { ObservableState } from './types-utils'

class GlobalState {
  inBatch = 0

  pendingReactions: Reaction[] = []

  trackingDerivation: IDerivation | null = null

  currentId = 0

  executeActionError = false

  allowStateChanged = false

  UNCHANGED = { value: 'UNCHANGED' }

  computationDepth = 0

  runId = 0
}

export const globalStateSymbol = Symbol('global state')

export const globalState = (function() {
  // justify whether global/window already has globalState
  const globalObj = getGlobal()
  return globalObj[globalStateSymbol] = new GlobalState()
})()

const mockGlobal: any = {}

function getGlobal() {
  if (globalThis !== undefined) {
    return globalThis
  }

  return mockGlobal
}

export function getNextId() {
  return ++globalState.currentId
}


export function startBatch() {
  globalState.inBatch++
}

export function endBatch() {
  if (--globalState.inBatch === 0) {
    runReactions()
  }
}

export function runReactions() {
  if (globalState.inBatch > 0) return
  const reactions = globalState.pendingReactions

  while(reactions.length > 0) {
    const remainReactions = reactions.splice(0)
    for (let i = 0; i < remainReactions.length; i++) {
      remainReactions[i].runReaction_()
    }
  }
}

export function reportObserved(observable: BaseObservable) {
  const derivation = globalState.trackingDerivation
  if (derivation !== null) {
    if (observable.lastAccessedBy !== derivation.runId) {
      derivation.newObserving[derivation.depsUnboundCount++] = observable
    }
    return true
  }

  return false
}

// ComputedValue will not call this function
export function reportChanged(observable: BaseObservable) {
  if (observable.observableState === ObservableState.outdated) return
  observable.observableState = ObservableState.outdated

  observable.observers.forEach((observer) => {
    if (observer.dependenciesState === ObservableState.updated) {
      observer.onOutdated()
    }
    observer.dependenciesState = ObservableState.outdated
  })
}

// Only ComputedValue will call this function.
export function reportPossiblyChanged(observable: ComputedValue) {
  if (observable.observableState !== ObservableState.updated) return
  observable.observableState = ObservableState.possiblyOutdated

  observable.observers.forEach((observer) => {
    if (observer.dependenciesState === ObservableState.updated) {
      observer.onOutdated()
    }
    observer.dependenciesState = ObservableState.possiblyOutdated
  })
}

export function reportConfirmChanged(observable: ComputedValue) {
  if (observable.observableState === ObservableState.outdated) return
  observable.observableState = ObservableState.outdated

  observable.observers.forEach((observer) => {
    if (observer.dependenciesState === ObservableState.possiblyOutdated) {
      observer.dependenciesState = ObservableState.outdated
    } else if (observer.dependenciesState === ObservableState.updated) {
      observable.observableState = ObservableState.updated
    }
  })
}
