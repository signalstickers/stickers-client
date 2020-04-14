module.exports = require('@darkobits/ts-unified/dist/config/jest')({
  coveragePathIgnorePatterns: [
    '<rootDir>/src/etc',
  ],
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 40,
      functions: 50,
      lines: 35
    }
  }
});
