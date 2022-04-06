export enum ErrorType {
  cycleComputation,
  outOfBound,
  expectObject,
  noPropertyInObject,
  needProperty,
  entryDoesNotExist,
  getIndexAtomFromArray,
  cannotGetAtom,
  cannotGetAdministration
}

const errorMsg = {
  [ErrorType.cycleComputation](name: string, derivation: any) { return `Cycle detected in computation ${name}: ${derivation}`},
  [ErrorType.outOfBound](index: number, length: number) { return `Index out of the bound, ${index} is larger than ${length}` },
  [ErrorType.expectObject]: 'Expect object.',
  [ErrorType.noPropertyInObject](propName: PropertyKey, debugName: string) { return `No observable property '${String(propName).toString()}' found in observable object : '${debugName}' ` },
  [ErrorType.needProperty]: 'Need specify a property.',
  [ErrorType.entryDoesNotExist](propName: PropertyKey, debugName: string) { return `The entry ${String(propName).toString()} does not exist in observable map ${debugName}.` },
  [ErrorType.getIndexAtomFromArray]: 'Can not get index atoms from arrays.',
  [ErrorType.cannotGetAtom](debugName: string) { return `Can not get atom from ${debugName}.` },
  [ErrorType.cannotGetAdministration](debugName: string) { return `Can not get administration from ${debugName}.` },
}


export function throwError(errorType: ErrorType, ...args: any[]) {
  let error: any = errorMsg[errorType]
  // eslint-disable-next-line prefer-spread
  if (typeof error === 'function') error = error.apply(null, args)
  throw new Error(`[STATE] ${error}`)
}
