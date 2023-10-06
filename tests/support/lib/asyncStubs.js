
module.exports = {
    doNothing() {},

    returns(positionOfCallback, dataToReturn, parameterCollector) {
        return function () {
            if (Array.isArray(parameterCollector)) {
                parameterCollector.push(arguments);
            }

            let callback = arguments[positionOfCallback];
            callback(null, dataToReturn);
        };
    },

    returnsError(positionOfCallback, error) {
        return function () {
            let callback = arguments[positionOfCallback];
            callback(error, null);
        };
    }
};
