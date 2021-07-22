import { NODE_ENV } from './types'

export default function getClientEnvironment() {
  const raw = Object.keys(process.env)
    .reduce((acc: { [key: string]: string }, key) => {
      acc[key] = process.env[key] || ''
      return acc
    }, {
      NODE_ENV: process.env.NODE_ENV || NODE_ENV.DEVELOPMENT,
    })
  const stringified = {
    'process.env': Object.keys(raw).reduce((env: { [key: string]: string }, key) => {
      // eslint-disable-next-line no-param-reassign
      env[key] = JSON.stringify(raw[key])
      return env
    }, {}),
  }
  return { raw, stringified }
}
