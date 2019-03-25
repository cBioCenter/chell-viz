import { default as CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as webpack from 'webpack';

// TODO: Use https://github.com/TypeStrong/typedoc and https://github.com/Microsoft/Typedoc-Webpack-Plugin
// tslint:disable-next-line:no-var-requires
// const TypedocWebpackPlugin = require('typedoc-webpack-plugin'); //

import * as path from 'path';

module.exports = {
  entry: {
    example: './examples/example.tsx',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'configs', 'tsconfig.webpack.json'),
            context: __dirname,
          },
        },
      },
      {
        // Needed for Plotly.js: https://github.com/plotly/plotly.js#building-plotlyjs-with-webpack
        loader: 'ify-loader',
        test: /\.js$/,
      },
      {
        include: [path.resolve(__dirname, 'node_modules/anatomogram')],
        test: /\.(jpe?g|png|gif)$/i,
        use: [
          {
            loader: `image-webpack-loader`,
            options: {
              query: {
                bypassOnDebug: true,
                gifsicle: {
                  interlaced: true,
                },
                mozjpeg: {
                  progressive: true,
                },
                optipng: {
                  optimizationLevel: 7,
                },
              },
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|png|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  optimization: {
    runtimeChunk: true,
    splitChunks: {
      automaticNameDelimiter: '~',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/,
        },
      },
      chunks: 'all',
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      maxSize: 0,
      minChunks: 1,
      minSize: 30000,
      name: true,
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      chunks: ['example'],
      favicon: 'assets/favicons/favicon.ico',
      filename: 'example.html',
      inject: true,
      template: './examples/example.html',
      title: 'Bioblocks - Contact Map / NGL Example',
    }),
    new CopyWebpackPlugin([
      {
        from: './assets/datasets',
        to: './datasets',
        toType: 'dir',
      },
    ]),
    new CopyWebpackPlugin([
      {
        from: './assets',
        ignore: ['*.pdf'],
        to: './assets',
        toType: 'dir',
      },
    ]),
    new CopyWebpackPlugin([
      {
        from: './SPRING_dev',
        to: './',
        toType: 'dir',
      },
    ]),
    new webpack.NamedModulesPlugin(),
  ],
  resolve: {
    alias: {
      ngl: path.resolve(__dirname, './node_modules/ngl/dist/ngl.js'),
      'plotly.js/lib/index-gl2d': path.resolve(__dirname, './node_modules/plotly.js/dist/plotly-gl2d.min.js'),
      '~bioblocks-viz~': path.resolve(__dirname, './src'),
      '~bioblocks-viz~/action': path.resolve(__dirname, './src/action'),
      '~bioblocks-viz~/component': path.resolve(__dirname, './src/component'),
      '~bioblocks-viz~/container': path.resolve(__dirname, './src/container'),
      '~bioblocks-viz~/context': path.resolve(__dirname, './src/context'),
      '~bioblocks-viz~/data': path.resolve(__dirname, './src/data'),
      '~bioblocks-viz~/helper': path.resolve(__dirname, './src/helper'),
      '~bioblocks-viz~/hoc': path.resolve(__dirname, './src/hoc'),
      '~bioblocks-viz~/reducer': path.resolve(__dirname, './src/reducer'),
    },
    extensions: ['.js', '.json', '.ts', '.tsx'],
    modules: [path.join(__dirname, 'src'), path.join(__dirname, 'types'), path.resolve('node_modules'), 'node_modules'],
  },
};
