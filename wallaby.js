const wallabyWebpack = require("wallaby-webpack");
const webpackPostprocessor = wallabyWebpack({});

module.exports = function (wallaby) {
  return {
    files: [
      { pattern: "imports/**/*.js" },
      { pattern: "server/**/*.js" },
      { pattern: "client/**/*.js" },
      { pattern: "tests/**unit/**/*.test.js", ignore: true },
    ],

    tests: [{ pattern: "tests/**unit/**/*.test.js", load: false }],

    compilers: {
      "**/*.js": wallaby.compilers.babel(),
    },

    postprocessor: webpackPostprocessor,

    setup: (wallaby) => {
      const mocha = wallaby.testFramework;

      const chai = require("chai");
      const sinon = require("sinon");

      chai.use(require("sinon-chai"));

      // setup sinon hooks
      mocha.suite.beforeEach("sinon before", function () {
        if (null == this.sinon) {
          this.sinon = sinon.createSandbox();
        }
      });
      mocha.suite.afterEach("sinon after", function () {
        if (this.sinon && "function" === typeof this.sinon.restore) {
          this.sinon.restore();
        }
      });
      window.expect = chai.expect;
      window.__moduleBundler.loadTests();
      global.expect = require("chai").expect;
    },

    testFramework: "mocha",

    env: {
      type: "node",
      runner: "node",
    },

    workers: { recycle: true },
  };
};
