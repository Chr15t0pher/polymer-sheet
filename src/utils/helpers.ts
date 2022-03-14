export function isNullish(value: any): value is null | undefined {
  return value === void 0 || value === null
}

export function isChinese(str: string) {
  const reg = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi
  return !!reg.test(str)
}

export function isEnglish(str: string) {
  const reg = /[a-zA-Z]/gi
  return !!reg.test(str)
}

export function isOdd(value: number) {
  return value % 2 === 1
}

export function getType(value: unknown) {
  return Object.prototype.toString.call(value).replace(/^\[object (.+)\]$/, '$1')
}

export function isPlainObject(value: unknown) {
  return getType(value) === 'Object'
}

export function mergeOptions<T extends Dictionary, U extends Dictionary>(
  defaults: T,
  config: U
) {
  const res = {...defaults} as T & U

  for (const key in config) {
    const defaultValue = defaults[key]
    const value = config[key]
    if (!isNullish(value)) {
      // @ts-ignore
      res[key] = !isPlainObject(defaultValue) || !isPlainObject(value)
        ? value
        : mergeOptions(defaultValue, value)
    }
  }

  return res
}

export function pick<T extends Dictionary, K extends keyof T>(obj: T, keyNames: K[]) {
  const res = {} as Pick<T, K>

  (Object.keys(obj) as K[]).forEach(keyName => {
    if (keyNames.includes(keyName)) {
      res[keyName] = obj[keyName]
    }
  })

  return res
}
