// Next.js configuration example
const FluentUICompatPlugin = require('@cascadiacollections/fluentui-compat-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(new FluentUICompatPlugin({
      verbose: process.env.NODE_ENV === 'development'
    }));
    return config;
  }
};

module.exports = nextConfig;