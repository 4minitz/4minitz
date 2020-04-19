require('../end2end/helpers/Server');

describe('suite sync', () => {
    before('reset app', () => {
        server.connect();
        server.call('e2e.resetMyApp', false);
        server.close();
    });

    it('test sync', () => {
        browser.url('https://webdriver.io');
        expect(browser.getTitle()).to.equal('WebdriverIO · Next-gen browser automation test framework for Node.js');
    });
});
