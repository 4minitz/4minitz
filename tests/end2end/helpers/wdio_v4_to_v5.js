import {E2EGlobal} from './E2EGlobal';

browser.elements = function (selector) {
    // https://w3c.github.io/webdriver/#dfn-table-of-location-strategies
    // https://webdriver.io/docs/selectors.html
    // "css selector", "link text" (=...), "partial link text" (*=...), "tag name" (<my-element />), "xpath" (//body/p[2])
    //
    // return browser.findElements('css selector', selector); // or: 'xpath' as using
    return browser.$$(selector);
};
browser.isVisible = function (selector) {
    return $(selector).isDisplayed();
};
browser.isExisting = function (selector) {
    return $(selector).isExisting();
};
browser.click = function (selector) {
    try {
        return $(selector).click();
    } catch (e) {
        let id = Math.random().toString(36).substr(2, 5);
        console.log(`browser.click() target "${selector}" not found - see screenshot with ID: ${id}`);
        E2EGlobal.saveScreenshot(`click-error_${id}`);
        throw e;
    }
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
    try {
        // Attention: webdriver.io v5.22.4 / v5.22.5 has bug in waitForDisplayed
        //            Other than the API states, this method still has the OLD v4 parameter interface!
        //            So, this does NOT work:
        //        let options = {timeout, reverse, timeoutMsg, interval};
        //        return $(selector).waitForDisplayed( options );
        // see: https://github.com/webdriverio/webdriverio/blob/v5/packages/webdriverio/src/commands/element/waitForDisplayed.js
        // but this works:
        return $(selector).waitForDisplayed( timeout, reverse, timeoutMsg);
    }
    catch (e) {
        let id = Math.random().toString(36).substr(2, 5);
        console.log(`browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`);
        E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
        throw e;
    }
};
browser.scroll = function (selector) {
    return $(selector).scrollIntoView();
};

browser.scrollXY = function (x, y) {
    browser.execute('window.scrollTo('+x+','+y+');');
};
