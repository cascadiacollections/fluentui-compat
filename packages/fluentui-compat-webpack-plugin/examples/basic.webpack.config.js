// Basic webpack configuration example with FluentUI Compat Plugin
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    // Default configuration - uses built-in mappings
    new FluentUICompatPlugin()
  ]
};