import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
  testMatch: ["**/src/__tests__/**/*.test.ts"],
}

export default config