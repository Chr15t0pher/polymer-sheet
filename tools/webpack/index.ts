import fs from 'fs'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import getArgv from './argv'
import getDevtool from './devtool'
import getEntry from './entry'
import getOutput from './output'
import getRules from './rules'
import getOptimization from './optimization'
import getPlugins from './plugins'
import { fork, formatStats, resolvePath } from './util'
import { ENV, NODE_ENV } from './types'

const env = process.env as unknown as ENV

const argv = getArgv(env || {})

const config = {
  target: 'web',

  mode: argv.NODE_ENV,

  devtool: getDevtool(argv),

  entry: getEntry(argv),

  output: getOutput(argv),

  resolve: {
    extensions: [
      '.ts',
      '.js',
      '.styl',
      '.css',
    ],
    modules: [
      'node_modules',
    ],
  },

  module: {
    rules: getRules(argv),
  },

  plugins: getPlugins(argv),

  optimization: getOptimization(argv),
}

export default config

fork(
  argv.NODE_ENV === NODE_ENV.DEVELOPMENT,
  () => {
    // dev
    const server = new WebpackDevServer(
      webpack(config),
      {
        hot: true,
      },
    )
    server.listen(argv.port)
  },
  () => {
    // build
    fs.rmdir(resolvePath('dist'), { recursive: true }, () => {
      webpack(config,
        (error, stats) => {
          if (error) {
            throw error
          }
          if (stats?.hasErrors()) {
            throw new Error('Build failed with errors')
          }
          console.info(formatStats(stats!, argv))
        })
    })
  },
)
