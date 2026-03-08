module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["routes/**/*.js", "app.js"],
  testMatch: ["**/tests/**/*.test.js"],
};
