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
