import type { IEnhancer } from './modifiers'
import { IPlainObject, IBabelDescriptor, throwError, ErrorType } from '../utils'
import type { CreateObservableOptions } from './baseobservable'

import { isBaseObservable, $obs, asCreateObservableOptions } from './baseobservable'
import { isReaction } from './reaction'
import { deepEnhancer, referenceEnhancer } from './modifiers'
import { isObservableObject, asObservableObject, createObservableObject, extendObservable } from './observableobject'
import { createObservableArray, isObservableArray } from './observablearray'
import { isObservableMap, ObservableMap } from './observablemap'
import { isObservableSet, ObservableSet } from './observableset'
import { ObservableValue } from './observablevalue'
import { addHiddenProp, hasProp } from '../utils'
import { isComputedValue } from './computedvalue'

export function isObservable(v: any) {
  if (v === undefined || v === null) return false

  return(
    isObservableObject(v) ||
    isReaction(v) ||
    isBaseObservable(v) ||
		isComputedValue(v) ||
    !!v[$obs]
  )
}

export const pendingDecoratorSymbol = Symbol('pending decorator')
export const didRunLazyInitializerSymbol = Symbol('did run lazy initializer')

const enumerableDescriptorCache: { [prop: string]: TypedPropertyDescriptor<any> } = {}
const nonEnumerableDescriptorCache: { [prop: string]: TypedPropertyDescriptor<any> } = {}

function createDecoratorInitializer(
  prop: PropertyKey,
  enumerable = true
): TypedPropertyDescriptor<any> {

  const cache = enumerable ? enumerableDescriptorCache : nonEnumerableDescriptorCache
  return (
    // @ts-ignore
    cache[prop] ||
    // @ts-ignore
    (cache[prop] = {
      configurable: true,
      enumerable: enumerable,
      get(this: any) {
        initializeInstance(this)
        return this[prop]
      },
      set(this: any, value) {
        initializeInstance(this)
        this[prop] = value
      }
    })
  )
}

function initializeInstance(target: any) {
  if (target[didRunLazyInitializerSymbol] === true) return
  const decorators = target[pendingDecoratorSymbol]
  if (decorators) {
    addHiddenProp(target, didRunLazyInitializerSymbol, true)
    for (const prop in decorators) {
      const d = decorators[prop]
      d.propertyBindToAdm(target, d.decoratorProp, d.decoratorPropDescriptor, d.decoratorArgs)
    }
  }
}

type PropertyCreator = (
  target: any,
  prop: PropertyKey,
  descriptor: TypedPropertyDescriptor<any>,
  decoratorArgs: any[]
) => void

// create annotation with enhancer
export function createPropDecorator<T>(propCreator: PropertyCreator) {
  return function decoratorFactory(..._: any[]) {
    let decoratorArgs: any[]

    function decorator(
      target: any,
      prop: PropertyKey,
      descriptor: TypedPropertyDescriptor<T>,
      applyImmediately: boolean
    ) {
      if (applyImmediately) {
        propCreator(target, prop, descriptor, decoratorArgs)
        return null
      }
      if (!hasProp(target, pendingDecoratorSymbol)) {
        addHiddenProp(target, pendingDecoratorSymbol, {})
      }
      target[pendingDecoratorSymbol][prop] = {
        decoratorTarget: target,
        decoratorProp: prop,
        decoratorPropDescriptor: descriptor,
        decoratorArgs,
        propertyBindToAdm: propCreator,
      }

      return createDecoratorInitializer(prop)
    }

    if (((arguments.length === 2 || arguments.length === 3) && typeof arguments[1] === 'string') || (arguments.length === 4 && arguments[3] === true)) {
      decoratorArgs = []
      // eslint-disable-next-line prefer-spread
      return decorator.apply(null, arguments as any)
    } else {
      decoratorArgs = Array.prototype.slice.call(arguments)
      return decorator
    }
  }
}

function createDecoratorForEnhancer(enhancer: IEnhancer<any>) {
  const decorator = createPropDecorator(
    (target: any, decoratorProp: PropertyKey, decoratorPropDescriptor: IBabelDescriptor) => {
      let value = decoratorPropDescriptor.value
      if (decoratorPropDescriptor.initializer) {
        value = decoratorPropDescriptor.initializer()
      }
      asObservableObject(target).addObservableProperty(decoratorProp, value, enhancer)
    }
  )

  return Object.assign(decorator, { enhancer })
}

export const deepDecorator = createDecoratorForEnhancer(deepEnhancer)
export const referenceDecorator = createDecoratorForEnhancer(referenceEnhancer)

export function getEnhancerFromOptions(options: CreateObservableOptions): IEnhancer<any> {
  return options.defaultDecorator ?
    options.defaultDecorator.enhancer :
    options.deep === true ?
      deepEnhancer :
      referenceEnhancer
}

export function getDefaultDecoratorFromOptions(options: CreateObservableOptions) {
  return options.defaultDecorator ?
    options.defaultDecorator :
    options.deep === true ?
      deepDecorator :
      referenceDecorator
}

export const observableFactories = {
  box<T>(value?: T, options?: CreateObservableOptions) {
    const o = asCreateObservableOptions(options)
    return new ObservableValue(value, o.name, getEnhancerFromOptions(o), o.equals)
  },
  array<T>(target: T[], options?: CreateObservableOptions) {
    const o = asCreateObservableOptions(options)
    return createObservableArray(target, getEnhancerFromOptions(o), o.name)
  },
  // observable.object({ a }, { a: action })
  object<T extends IPlainObject>(target: T, decorators?: { [K in keyof T]: (...args: any)=> void }, options?: CreateObservableOptions) {
    const o = asCreateObservableOptions(options)
    const proxy = createObservableObject({}, o)
    const defaultDecorator = getDefaultDecoratorFromOptions(o)
    extendObservable(proxy as IPlainObject, target, decorators, defaultDecorator)
    return proxy
  },
  set<T>(set: Set<T>, options?: CreateObservableOptions) {
    const o = asCreateObservableOptions(options)
    return new ObservableSet(set, getEnhancerFromOptions(o))
  },
  map<K, T>(map: Map<K, T>, options?: CreateObservableOptions) {
    const o = asCreateObservableOptions(options)
    return new ObservableMap(map, getEnhancerFromOptions(o))
  },
  ref: referenceDecorator,
  deep: deepDecorator
}

export function getAtom(thing: any, property?: PropertyKey) {
  if (typeof thing === 'object' && thing !== null) {
    if (isObservableArray(thing)) {
      if (property !== undefined) throwError(ErrorType.getIndexAtomFromArray)
      return thing[$obs].atom
    } else if (isObservableSet(thing)) {
      return thing.atom
    } else if (isObservableMap(thing)) {
      if (property === undefined) return thing.keysAtom
      const observable = thing.values_.get(property) || thing.hasMap_.get(property)
      if (!observable) throwError(ErrorType.entryDoesNotExist)
      return observable
    } else if (isObservableObject(thing)) {
      if (!property) throwError(ErrorType.needProperty)
      const observable = thing[$obs].values.get(property) || thing[$obs].pendingKeys.get(property)
      if (!observable) throwError(ErrorType.noPropertyInObject, getDebugName(thing))
      return observable
    } else if (isComputedValue(thing) || isBaseObservable(thing)) {
      return thing
    }
  }
  throwError(ErrorType.cannotGetAtom, getDebugName(thing))
}

export function getAdministration(thing: any, property?: PropertyKey): any {
  if (!thing) throwError(ErrorType.expectObject)
  if (property !== undefined) return getAdministration(getAtom(thing, property))
  if (isBaseObservable(thing) || isComputedValue(thing)) return thing
  if (isObservableMap(thing) || isObservableSet(thing)) return thing
  if (thing[$obs]) return thing[$obs]
  throwError(getDebugName(thing))
}

export function getDebugName(thing: any, property?: PropertyKey) {
  let named
  if (property !== undefined) {
    named = getAtom(thing, property)
  } else if (isObservableObject(thing) || isObservableArray(thing) || isObservableMap(thing) || isObservableSet(thing)) {
    named = getAtom(thing)
  }
  return named.name
}
