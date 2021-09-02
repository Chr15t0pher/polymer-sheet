
import { isNullish } from './validators'

export function mergeOptions<T extends Dictionary>(
  defaults: T,
  config: T
) {
  const res = {...defaults}

  for (const key in config) {
    if (isNullish(config[key])) {
      continue
    }
    res[key] = config[key]
  }

  return res
}
