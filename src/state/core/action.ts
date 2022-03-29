import type { IDerivation } from './derivation'

import { globalState, endBatch, startBatch } from './globalstate'

export function transaction<T>(action: () => T, thisArg = undefined) {
  startBatch()
  try {
    action.apply(thisArg)
  } finally {
    endBatch()
  }
}

export function createAction(actionName: string, fn: (...args: any[]) => void, ref?: Record<PropertyKey, unknown>) {
  const res = function(this: any) {
    executeAction(actionName, fn, ref || this, arguments)
  }
  return res
}

function executeAction(actionName: string, fn: () => void, scope?: Record<PropertyKey, unknown>, args?: IArguments) {
  const actionInfo = startAction()
  let executeActionError = true
  try {
    const res = fn.apply(scope, args as any)
    executeActionError = false
    return res
  } finally {
    if (executeActionError) {
      globalState.executeActionError = executeActionError
      globalState.executeActionError = false
    }
    endAction(actionInfo)
  }
}

interface IActionInfo {
  prevDerivation: IDerivation | null,
  prevAllowStateChanged: boolean
}

/**
 *
 *
 * action should not trigger reaction observation, thus, action need to be wrapped in untrack()
 */
export function startAction() {
  const prevDerivation = untrackedStart()
  startBatch()
  const prevAllowStateChanged = allowStateChangedStart(true)
  return {
    prevDerivation,
    prevAllowStateChanged
  }
}

export function endAction(actionInfo: IActionInfo) {
  const { prevAllowStateChanged, prevDerivation } = actionInfo
  allowStateChangedEnd(prevAllowStateChanged)
  endBatch()
  untrackedEnd(prevDerivation)
}

export function untrackedStart() {
  const prevDerivation = globalState.trackingDerivation
  globalState.trackingDerivation = null
  return prevDerivation
}

export function untrackedEnd(derivation: IDerivation | null) {
  globalState.trackingDerivation = derivation
}

export function untracked<T>(action: () => T, thisArg = undefined) {
  const prev = untrackedStart()
  try {
    return action.apply(thisArg)
  } finally {
    untrackedEnd(prev)
  }
}

export function allowStateChangedStart(allowStateChanged: boolean) {
  const prevAllowStateChanged = globalState.allowStateChanged
  globalState.allowStateChanged = allowStateChanged
  return prevAllowStateChanged
}

export function allowStateChangedEnd(allowStateChanged: boolean) {
  globalState.allowStateChanged = allowStateChanged
}
