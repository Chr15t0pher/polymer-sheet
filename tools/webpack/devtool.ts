import { Configuration } from 'webpack'
import { Argv, NODE_ENV } from './types'

export default function getDevtool(argv: Argv): Configuration['devtool'] {
  if (argv.NODE_ENV === NODE_ENV.DEVELOPMENT) {
    return 'cheap-module-source-map'
  }
  if (argv.NODE_ENV === NODE_ENV.PRODUCTION) {
    return 'source-map'
  }
  return false
}
