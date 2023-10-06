module.exports = {
  doNothing() {},

  returns(positionOfCallback, dataToReturn, parameterCollector) {
    return function () {
      if (Array.isArray(parameterCollector)) {
        parameterCollector.push(arguments);
      }

      const callback = arguments[positionOfCallback];
      callback(null, dataToReturn);
    };
  },

  returnsError(positionOfCallback, error) {
    return function () {
      const callback = arguments[positionOfCallback];
      callback(error, null);
    };
  },
};
