import { once } from '../utils'
import { untracked } from './action'

export enum changeType {
  UPDATE = 'update',
  DELETE = 'delete',
  ADD = 'add',
}

export enum changeSubjectType {
  object = 'object',
  array = 'array',
  map = 'map',
  set = 'set',
  box = 'box',
  computed = 'computed'
}

export type IChangeInfo<T, K = any, V = any> = {
  subjectType: changeSubjectType,
  subjectName: string
  subject: T,
  name: K,
  type: changeType,
  prev: V,
  next: V
}

export interface IChangeListener<T, K = any, V = any> {
  (change: IChangeInfo<T, K, V>): void
}

export interface IListenable<T, K = any, V = any> {
  changeListeners: Set<IChangeListener<T, K, V>>
}

export function hasListener<T, K, V>(thing: IListenable<T, K, V>) {
  return thing.changeListeners.size > 0
}

export function registerListener<T, K, V>(thing: IListenable<T, K, V>, listener: IChangeListener<T, K, V>) {
  if (!thing.changeListeners.has(listener)) {
    thing.changeListeners.add(listener)
  }
  return once(() => {
    if (thing.changeListeners.has(listener)) {
      thing.changeListeners.delete(listener)
    }
  })
}

export function notifyListeners<T, K, V>(thing: IListenable<T, K, V>, change: IChangeInfo<T, K, V>) {
  untracked(() => {
    const listeners = Array.from(thing.changeListeners.values())
    for (const listener of listeners) {
      listener(change)
    }
  })
}
