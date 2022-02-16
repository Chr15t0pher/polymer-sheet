import type { IEqualComparer } from '../utils'
import type { IEnhancer } from './modifiers'
import { BaseObservable } from './baseobservable'
import {
  comparer,
} from '../utils'
import { getNextId } from './globalstate'
import {
  globalState,
} from './globalstate'

export class ObservableValue<T = any> extends BaseObservable {
  value: T

  constructor(
    value: T,
    public enhancer: IEnhancer<any>,
    public name: string = 'ObservableValue@' + getNextId(),
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
    this.value = newValue
    this.reportChanged()
  }
}
