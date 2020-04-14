module.exports = require('@darkobits/ts-unified/dist/config/jest')({
  coveragePathIgnorePatterns: [
    '<rootDir>/src/etc',
  ],
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 35,
      functions: 50,
      lines: 30
    }
  }
});
