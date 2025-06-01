// CRACO configuration for Create React App
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

module.exports = {
  webpack: {
    plugins: {
      add: [
        new FluentUICompatPlugin({
          verbose: process.env.NODE_ENV === 'development'
        })
      ]
    }
  }
};