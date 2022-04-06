import type { IDerivation } from './derivation'
import type { BaseObservable } from './baseobservable'

import { globalState, startBatch, endBatch, runReactions } from './globalstate'
import {
  trackDerivedFunction,
} from './derivation'

import {
  wrapInstanceWithPredicate,
} from '../utils'
import { ObservableState } from './types-utils'

export class Reaction implements IDerivation {
  dependenciesState = ObservableState.notTracking

  newObserving: BaseObservable[] = []

  observing: BaseObservable[] = []

  disposed = false

  running = false

  // per reaction may have multiple observable(dependencies)
  depsUnboundCount = 0

  runId = 0

  constructor(public name: string, public handleOutdated: () => void) {}

  schedule() {
    this.onOutdated()
  }

  onOutdated() {
    globalState.pendingReactions.push(this)
    runReactions()
  }

  runReaction_() {
    this.handleOutdated()
  }

  track(fn: () => void) {
    if (this.disposed) {
      return
    }

    startBatch()
    this.running = true
    const prevReaction = globalState.trackingDerivation
    globalState.trackingDerivation = this
    trackDerivedFunction(this, fn, undefined)
    globalState.trackingDerivation = prevReaction
    endBatch()
  }

  dispose = () => {
    if (!this.disposed) {
      this.disposed = true
      if (!this.running) {
        // TODO: clearObserving
      }
    }
  }
}

export const isReaction = wrapInstanceWithPredicate('Reaction', Reaction)
