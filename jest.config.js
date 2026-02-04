module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/pages/api/**',
    '!src/lib/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
