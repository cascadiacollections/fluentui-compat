#!/bin/bash
# Jest wrapper script for Rush monorepo

# Set working directory to this package
cd "$(dirname "$0")"

# Run jest with proper environment and clean output
NODE_PATH="./node_modules" ./node_modules/.bin/jest --no-watch --no-watchman --passWithNoTests --forceExit --detectOpenHandles "$@"
