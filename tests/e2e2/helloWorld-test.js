describe('suite sync', () => {
    it('test sync',
        () => {
            browser.url('https://webdriver.io');
            expect(browser.getTitle()).to.equal('WebdriverIO · Next-gen browser automation test framework for Node.js');
        });
});
