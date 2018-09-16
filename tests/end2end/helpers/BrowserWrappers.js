import { E2EGlobal } from './E2EGlobal';

const wrapClick = () => {
    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.click_org = browser.click;
    browser.click = function (...args) {
        try {
            browser.click_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.click() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`click-error_${id}`);
            throw e;
        }
    };
};

const wrapWaitForVisible = () => {
    // We refactor the browser.waitForVisible() method to save a screenshot
    // with a unique ID if waitForVisible() fails.
    browser.waitForVisible_org = browser.waitForVisible;
    browser.waitForVisible = function (selector, timeout = 10000, ...args) {
        try {
            browser.waitForVisible_org(selector, timeout, ...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
            throw e;
        }
    };
};

const wrapElementIdClick = () => {
    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.elementIdClick_org = browser.elementIdClick;
    browser.elementIdClick = function (...args) {
        try {
            browser.elementIdClick_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.elementIdClick() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`clickId-error_${id}`);
            throw e;
        }
    };
};

export function setupWrappers() {
    wrapClick();
    wrapElementIdClick();
    wrapWaitForVisible();
}