// Advanced webpack configuration with custom mappings
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
    new FluentUICompatPlugin({
      // Custom mappings for your project
      mappings: [
        {
          from: '@fluentui/utilities',
          to: '@cascadiacollections/fluentui-compat',
          exports: {
            'Async': 'useAsync'
          }
        },
        {
          from: '@fluentui/react-icons',
          to: '@cascadiacollections/fluentui-compat',
          exports: {
            'bundleIcon': 'bundleIcon'
          }
        }
      ],
      // Enable verbose logging in development
      verbose: process.env.NODE_ENV === 'development'
    })
  ]
};