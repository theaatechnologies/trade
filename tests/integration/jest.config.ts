import { resolve } from "path";

export default {
  preset: "ts-jest",
  setupFilesAfterEnv: ["./setup.ts"],
  restoreMocks: true,
  moduleNameMapper: {
    "^src/(.*)$": resolve(__dirname, "../../src/$1"),
    "^tests/(.*)$": resolve(__dirname, "../../tests/$1"),
  },
};
