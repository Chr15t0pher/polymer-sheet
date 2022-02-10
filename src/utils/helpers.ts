
import { isNullish } from './validators'

export function mergeOptions<T extends Dictionary, U extends T>(
  defaults: U,
  config: T
) {
  const res = {...defaults}

  for (const key in config) {
    const value = config[key]
    if (!isNullish(value)) {
      // @ts-ignore
      res[key] = value
    }
  }

  return res
}
