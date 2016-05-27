let e2e = require('./E2EHelpers');

before(function() {
    console.log("End2End Settings:");
    console.log("# of test users:", e2e.settings.e2eTestUsers.length);

    e2e.resetMyApp();
    e2e.launchApp();
    e2e.loginUser();
    expect(e2e.isLoggedIn()).to.be.true;
});