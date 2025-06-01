module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: false,
  silent: false,
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Optimized for VS Code Jest extension
  reporters: ["default"],
  collectCoverage: false,
  errorOnDeprecated: false,
};
