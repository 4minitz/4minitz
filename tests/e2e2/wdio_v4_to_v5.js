
browser.isExisting = function (selector) {
    return $(selector).isExisting();
};
browser.click = function (selector) {
    return $(selector).click();
};
browser.getHTML = function (selector) {
    return $(selector).getHTML();
};
browser.getValue = function (selector) {
    return $(selector).getValue();
};
browser.setValue = function (selector, value) {
    return $(selector).setValue(value);
};
browser.waitForExist = function (selector, timeout, reverse, timeoutMsg, interval) {
    return $(selector).waitForExist( {timeout, reverse, timeoutMsg, interval} );
};
browser.waitForVisible = function (selector, timeout, reverse, timeoutMsg, interval) {
    return $(selector).waitForDisplayed( {timeout, reverse, timeoutMsg, interval} );
};
browser.scroll = function (selector) {
    return $(selector).scrollIntoView();
};
