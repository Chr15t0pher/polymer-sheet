
import { isNullish } from './validators'

export function mergeOptions<T extends Dictionary, U extends Dictionary>(
  defaults: T,
  config: U
) {
  const res = {...defaults} as T & U

  for (const key in config) {
    const value = config[key]
    if (!isNullish(value)) {
      // @ts-ignore
      res[key] = value
    }
  }

  return res
}
