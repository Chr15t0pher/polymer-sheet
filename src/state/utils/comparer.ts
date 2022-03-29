import { isObservableArray, isObservableMap, isObservableSet } from '../core'
import { hasProp, isFunction } from './utils'

export interface IEqualComparer<T> {
  (a: T, b: T): boolean
}

function structuralComparer(a: any, b: any) {
  return deepEqual(a, b)
}

function referenceComparer(a: any, b: any) {
  return a === b
}

// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function defaultComparer(a: any, b: any) {
  if (Object.is) Object.is(a, b)

  // SameValue algorithm
  if (a === b) {
    return a !== 0 || 1 / a === 1 / b
  } else {
    return a !== a && b !== b
  }
}

function deepEqual(a: any, b: any) {
  return eq(a, b)
}

// https://github.com/jashkenas/underscore/blob/master/underscore.js#L356
function eq(a: any, b: any, depth = -1, aStack: any[] = [], bStack: any[] = []) {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](https://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b) return a !== 0 || 1 / a === 1 / b
  // `null` or `undefined` only equal to itself (strict comparison).
  if (a == null || b == null) return false
  // `NaN`s are equivalent, but non-reflexive.
  if (a !== a) return b !== b
  // Exhaust primitive checks
  const type = typeof a
  if (type !== 'function' && type !== 'object' && typeof b != 'object') return false

  const className = toString.call(a)
  if (className !== toString.call(b)) return false
  switch (className) {
    // These types are compared by value.
    case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    // eslint-disable-next-line no-fallthrough
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return '' + a === '' + b
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive.
      // Object(NaN) is equivalent to NaN.
      if (+a !== +a) return +b !== +b
      // An `egal` comparison is performed for other numeric values.
      return +a === 0 ? 1 / +a === 1 / b : +a === +b
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a === +b
    case '[object Symbol]':
      // eslint-disable-next-line no-case-declarations
      return typeof Symbol !== 'undefined' && Symbol.valueOf.call(a) === Symbol.valueOf.call(b)
    case '[object Set]':
    case '[object Map]':
      if (depth >= 0) {
        depth++
      }
      break
  }

  a = unwrap(a)
  b = unwrap(b)

  const areArrays = className === '[object Array]'
  if (!areArrays) {
    if (typeof a != 'object' || typeof b != 'object') return false

    // Objects with different constructors are not equivalent, but `Object`s or `Array`s
    // from different frames are.
    const aCtor = a.constructor, bCtor = b.constructor
    if (
      aCtor !== bCtor &&
      !(
        isFunction(aCtor) &&
        aCtor instanceof aCtor &&
        isFunction(bCtor) &&
        bCtor instanceof bCtor
      ) &&
      ('constructor' in a && 'constructor' in b)
    ) {
      return false
    }
  }

  if (depth === 0) {
    return false
  } else if (depth < 0) {
    depth = -1
  }

  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

  // Initializing stack of traversed objects.
  // It's done here since we only need them for objects and arrays comparison.
  aStack = aStack || []
  bStack = bStack || []
  let length = aStack.length
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] === a) return bStack[length] === b
  }

  // Add the first object to the stack of traversed objects.
  aStack.push(a)
  bStack.push(b)

  // Recursively compare objects and arrays.
  if (areArrays) {
    // Compare array lengths to determine if a deep comparison is necessary.
    length = a.length
    if (length !== b.length) return false
    // Deep compare the contents, ignoring non-numeric properties.
    while (length--) {
      if (!eq(a[length], b[length], depth - 1,aStack, bStack)) return false
    }
  } else {
    // Deep compare objects.
    const _keys = Object.keys(a)
    let key
    length = _keys.length
    // Ensure that both objects contain the same number of properties before comparing deep equality.
    if (Object.keys(b).length !== length) return false
    while (length--) {
      // Deep compare each member
      key = _keys[length]
      if (!(hasProp(b, key) && eq(a[key], b[key], depth - 1, aStack, bStack))) return false
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop()
  bStack.pop()
  return true
}

function unwrap(a: any) {
  if (isObservableArray(a)) return a.slice()
  if (isObservableMap(a)) return Array.from(a.entries())
  if (isObservableSet(a)) return Array.from(a.entries())
  return a
}

export const comparer = {
  structural: structuralComparer,
  reference: referenceComparer,
  default: defaultComparer
}
