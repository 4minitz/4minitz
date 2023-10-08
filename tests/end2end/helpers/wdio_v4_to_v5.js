import { E2EGlobal } from "./E2EGlobal";

browser.elements = (selector) => browser.findElements("css selector", selector);
browser.isVisible = (selector) => $(selector).isDisplayed();
browser.isExisting = (selector) => $(selector).isExisting();
browser.click = (selector) => {
  try {
    return $(selector).click();
  } catch (e) {
    const id = Math.random().toString(36).substr(2, 5);
    console.log(
      `browser.click() target "${selector}" not found - see screenshot with ID: ${id}`,
    );
    E2EGlobal.saveScreenshot(`click-error_${id}`);
    throw e;
  }
};
browser.getHTML = (selector) => $(selector).getHTML();
browser.getValue = (selector) => $(selector).getValue();
browser.setValue = (selector, value) => $(selector).setValue(value);
browser.waitForExist = (selector,
  timeout,
  reverse,
  timeoutMsg,
  interval) => $(selector).waitForExist({ timeout, reverse, timeoutMsg, interval });
browser.waitForVisible = (selector,
  timeout,
  reverse,
  timeoutMsg,
  interval) => {
  try {
    return $(selector).waitForDisplayed({
      timeout,
      reverse,
      timeoutMsg,
      interval,
    });
  } catch (e) {
    const id = Math.random().toString(36).substr(2, 5);
    console.log(
      `browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`,
    );
    E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
    throw e;
  }
};
browser.browser.waitUntil = (selector, timeout, timeoutMsg, interval) => $(selector).waitUntil({ timeout, timeoutMsg, interval });
browser.scroll = (selector) => $(selector).scrollIntoView();

browser.scrollXY = (x, y) => {
  browser.execute("window.scrollTo(" + x + "," + y + ");");
};
