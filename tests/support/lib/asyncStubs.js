
module.exports = {
    doNothing() {},

    returns(positionOfCallback, dataToReturn) {
        return function () {
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