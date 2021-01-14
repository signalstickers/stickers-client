module.exports = require('@darkobits/ts').jest({
  coveragePathIgnorePatterns: [
    '<rootDir>/src/etc'
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
