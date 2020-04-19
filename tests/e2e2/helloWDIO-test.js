describe('suite sync', () => {
    it('test sync',
        () => {
            browser.url('http://localhost:3100');
            expect(browser.getTitle()).to.contain('4Minitz');

            let dateStr = (new Date()).toISOString().replace(/[^0-9]/g, '') + '_';
            let fullpath = './tests/snapshots/' + dateStr + '.png';
            browser.saveScreenshot(fullpath);
        });
});
