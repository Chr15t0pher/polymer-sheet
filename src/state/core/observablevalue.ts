import type { IEnhancer } from './modifiers'
import type { IChangeInfo, IChangeListener, IListenable } from './change'
import { IEqualComparer, wrapInstanceWithPredicate } from '../utils'
import { BaseObservable } from './baseobservable'
import {
  comparer,
} from '../utils'
import { getNextId } from './globalstate'
import {
  globalState,
} from './globalstate'
import { registerListener, hasListener, notifyListeners, changeSubjectType, changeType } from './change'
import { untracked } from './action'

export type IObservableValueChangeListener = IChangeListener<ObservableValue>

export class ObservableValue<T = any> extends BaseObservable implements IListenable<ObservableValue> {
  value: T
  changeListeners: Set<IObservableValueChangeListener> = new Set()

  constructor(
    value: T,
    name: string = 'ObservableValue@' + getNextId(),
    public enhancer: IEnhancer<any>,
    private equals: IEqualComparer<any> = comparer.default
  ) {
    super(name)
    this.value = this.enhancer(value, undefined, name)
  }

  get() {
    this.reportObserved()
    return this.value
  }

  set(value: T) {
    const newValue = this.prepareNewValue(value)
    if (newValue !== globalState.UNCHANGED) {
      this.setNewValue(newValue)
    }
  }

  prepareNewValue(newValue: any) {
    newValue = this.enhancer(newValue, this.value, this.name)
    return this.equals(newValue, this.value) ? globalState.UNCHANGED : newValue
  }

  setNewValue(newValue: any) {
    const prev = this.value
    this.value = newValue
    const needNotify = hasListener(this)
    this.reportChanged()
    if (needNotify) {
      untracked(() => {
        const change: IChangeInfo<ObservableValue> = {
          subjectType: changeSubjectType.box,
          subjectName: this.name,
          subject: this,
          name: this.name,
          type: changeType.UPDATE,
          prev,
          next: newValue
        }
        notifyListeners(this, change)
      })
    }
  }

  observe(listener: IObservableValueChangeListener) {
    return registerListener(this, listener)
  }
}

export const isObservableValue = wrapInstanceWithPredicate('ObservableValue', ObservableValue)
