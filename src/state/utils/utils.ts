export const EMPTY_ARRAY = []

export type IPlainObject<T = any> = Record<string | number | symbol, T>

export type IBabelDescriptor<T = any> = TypedPropertyDescriptor<T> & { initializer?: () => any }

export const ownKeys = typeof Reflect !== 'undefined'
  ? Reflect.ownKeys
  : Object.getOwnPropertySymbols
    ? (obj: IPlainObject) => Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj) as any[])
    : Object.getOwnPropertyNames

export const getDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors<T extends IPlainObject, F extends { [K in keyof T]: TypedPropertyDescriptor<any> }>(target: T): F {
  return ownKeys(target).reduce((prev: F, propName: string | symbol) => {
    // @ts-ignore
    prev[propName] = Object.getOwnPropertyDescriptor(target, propName)
    return prev
  }, {} as F)
}

export function hasProp(target: Record<string, unknown>, prop: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(target, prop)
}

export function defineProp(object: any, propName: PropertyKey, descriptor: PropertyDescriptor) {
  Object.defineProperty(object, propName, descriptor)
}

export function addHiddenProp(object: any, propName: PropertyKey, value: any) {
  defineProp(object, propName, {
    enumerable: false,
    writable: true,
    configurable: true,
    value
  })
}

export function isStringish(value: any): value is number | string | symbol {
  const type = typeof value
  switch (type) {
    case 'number':
    case 'string':
    case 'symbol':
      return true
    default:
      return false
  }
}

export function isObject(value: any) {
  return value !== null && Object.prototype.toString.call(value) === '[object Object]'
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function'
}

export function isMap(v: any): v is Map<any, any> {
  return v instanceof Map
}

export function isSet(v: any): v is Set<any> {
  return v instanceof Set
}

export function wrapInstanceWithPredicate<T>(name: string, clazz: new(...args: any[]) => T) {
  const propName = 'isMbx' + name
  clazz.prototype[propName] = true
  return function(x: any) {
    return isObject(x) && x[propName] === true
  }
}

export function makeIterable<T>(iterable: Iterator<T>) {
  // @ts-ignore
  iterable[Symbol.iterator] = function() { return this }
  return iterable as any
}
