import {E2EGlobal} from './E2EGlobal';

browser.elements = function (selector) {
    return browser.findElements('css selector', selector); // or: 'xpath' as using
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
        return $(selector).waitForDisplayed( {timeout, reverse, timeoutMsg, interval} );
    }
    catch (e) {
        let id = Math.random().toString(36).substr(2, 5);
        console.log(`browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`);
        E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
        throw e;
    }
};
browser.browser.waitUntil = function (selector, timeout, timeoutMsg, interval) {
    return $(selector).waitUntil( { timeout, timeoutMsg, interval });
};  
browser.scroll = function (selector) {
    return $(selector).scrollIntoView();
};

browser.scrollXY = function (x, y) {
    browser.execute('window.scrollTo('+x+','+y+');');
};
