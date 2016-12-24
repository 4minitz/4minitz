
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'


before(function() {
    console.log("End2End Settings:");
    console.log("# of test users:", E2EGlobal.SETTINGS.e2eTestUsers.length);

    E2EApp.resetMyApp();
    E2EApp.launchApp();
    E2EGlobal.saveScreenshot("UserShouldBeLoggedIn0");
    E2EApp.loginUser();
    E2EGlobal.saveScreenshot("UserShouldBeLoggedIn1");
    expect(E2EApp.isLoggedIn(), "User is logged in").to.be.true;
});
