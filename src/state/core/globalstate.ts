import type { IDerivation } from './derivation'
import type { BaseObservable } from './baseobservable'
import type { Reaction } from'./reaction'

class GlobalState {
  inBatch = 0

  pendingReactions: Reaction[] = []

  trackingDerivation: IDerivation | null = null

  currentId = 0

  executeActionError = false

  allowStateChanged = false

  UNCHANGED = {}

  computationDepth = 0
}

export const globalStateSymbol = Symbol('global state')

export const globalState = (function() {
  // justify whether global/window already has globalState
  const global = getGlobal()
  return global[globalStateSymbol] = new GlobalState()
})()

const mockGlobal: any = {}

function getGlobal() {
  if (typeof window !== undefined) {
    return window
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
    derivation.newObserving[derivation.depsUnboundCount++] = observable
    return true
  }

  return false
}

export function reportChanged(observable: BaseObservable) {
  observable.observers.forEach((observer) => {
    observer.onOutdated()
  })
}
