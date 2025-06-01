module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: false,
  silent: false,
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testTimeout: 10000,
  reporters: [["default", { silent: false, verbose: false }]],
  maxWorkers: 1,
  detectOpenHandles: false,
  forceExit: true,
};
