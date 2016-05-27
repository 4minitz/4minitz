
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


before(function() {
    console.log("End2End Settings:");
    console.log("# of test users:", E2EGlobal.SETTINGS.e2eTestUsers.length);

    E2EApp.resetMyApp();
    E2EApp.launchApp();
    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn()).to.be.true;
});