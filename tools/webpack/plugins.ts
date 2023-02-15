/* eslint-disable max-classes-per-file */
import CaseSensitivePathsWebpackPlugin from 'case-sensitive-paths-webpack-plugin'
import FriendlyErrorsPlugin from 'friendly-errors-webpack-plugin'
import {
  WebpackPluginInstance, DefinePlugin
} from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import DuplicatePackageCheckerPlugin from 'duplicate-package-checker-webpack-plugin'
import CircularDependencyPlugin from 'circular-dependency-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import WasmPackPlugin from '@wasm-tool/wasm-pack-plugin'
import { compact } from 'lodash'
import { Argv, NODE_ENV } from './types'
import getClientEnvironment from './env'
import { resolvePath } from './util'

export default function getPlugins(argv: Argv): WebpackPluginInstance[] {
  return compact([
    /**
     * https://github.com/Urthen/case-sensitive-paths-webpack-plugin#readme
     * This Webpack plugin enforces the entire path of all required modules match the exact case of the actual path on disk.
     * Using this plugin helps alleviate cases where developers working on OSX, which does not follow strict path case sensitivity,
     * will cause conflicts with other developers or build boxes running other operating systems which require correctly cased paths.
     */
    new CaseSensitivePathsWebpackPlugin(),

    new FriendlyErrorsPlugin(),

    /**
     * https://github.com/jantimon/html-webpack-plugin
     * Plugin that simplifies creation of HTML files to serve your bundles.
     */
    new HtmlWebpackPlugin({
      ...{
        inject: true,
        showErrors: true,
        template: argv.paths.template,
        title: 'polymer-sheet'
      },
      ...(argv.NODE_ENV === NODE_ENV.PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : {}),
    }),

    /**
     * https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin#readme
     * Webpack plugin that warns when your bundle contains multiple versions of the same package.
     */
    new DuplicatePackageCheckerPlugin() as WebpackPluginInstance,

    /**
     * https://github.com/aackerman/circular-dependency-plugin#readme
     * Detect modules with circular dependencies when bundling with webpack.
     */
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /src/,
      failOnError: argv.NODE_ENV === NODE_ENV.PRODUCTION,
      allowAsyncCycles: false,
    }) as WebpackPluginInstance,

    new DefinePlugin(getClientEnvironment().stringified),

    /**
     * https://github.com/webpack-contrib/mini-css-extract-plugin
     * This plugin extracts CSS into separate files.
     * It creates a CSS file per JS file which contains CSS.
     * It supports On-Demand-Loading of CSS and SourceMaps.
     */
    argv.NODE_ENV === NODE_ENV.PRODUCTION && new MiniCssExtractPlugin({
      filename: argv.paths.css,
      chunkFilename: '[name].[contenthash:8].chunk.css',
    }),


    /**
     * https://github.com/webpack-contrib/webpack-bundle-analyzer
     * Visualize size of webpack output files with an interactive zoomable treemap.
     */
    argv.analyze && new BundleAnalyzerPlugin(),

    new WasmPackPlugin({
      crateDirectory: resolvePath('./shared/wasm'),
      forceMode: argv.NODE_ENV
    })
  ])
}
