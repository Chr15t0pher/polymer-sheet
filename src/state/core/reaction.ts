import type { IDerivation } from './derivation'
import type { BaseObservable } from './baseobservable'

import { globalState, startBatch, endBatch, runReactions } from './globalstate'
import {
  trackDerivedFunction,
} from './derivation'

import {
  wrapInstanceWithPredicate,
} from '../utils'

export class Reaction implements IDerivation {
  newObserving: BaseObservable[] = []

  observing: BaseObservable[] = []

  disposed = false

  running = false

  // per reaction may have multiple observable(dependencies)
  depsUnboundCount = 0

  constructor(public name: string, public handleOutdated: () => void) {}

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
}

export const isReaction = wrapInstanceWithPredicate('Reaction', Reaction)
