require('../end2end/helpers/Server');
require('./wdio_v4_to_v5');

describe('Hello World', () => {
    before('reset app', () => {
        server.connect();
        server.call('e2e.resetMyApp', false);
    });
    
    it('test World',
        () => {
            browser.url('http://localhost:3100');
            expect(browser.getTitle()).to.contain('4Minitz');

            let dateStr = (new Date()).toISOString().replace(/[^0-9]/g, '') + '_';
            let fullpath = './tests/snapshots/' + dateStr + '.png';
            browser.saveScreenshot(fullpath);
        });
});
