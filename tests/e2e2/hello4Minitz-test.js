require('../end2end/helpers/Server');
require('./wdio_v4_to_v5');

import {E2EApp} from '../end2end/helpers/E2EApp';
import {E2EGlobal} from '../end2end/helpers/E2EGlobal';
import {E2EMeetingSeries} from '../end2end/helpers/E2EMeetingSeries';

describe('Hello 4Minitz', () => {
    before('reset app', () => {
        server.connect();
        server.call('e2e.resetMyApp', false);
    });

    it('test 4Minitz',
        () => {
            E2EApp.gotoStartPage();
            E2EGlobal.saveScreenshot('e2e_reloaded');
            expect (E2EApp.isLoggedIn()).to.be.true;
        });
});
