let e2e = require('./E2EHelpers');

console.log("End2End Settings:");
console.log("# of test users:"+e2e.settings.e2eTestUsers.length);


describe('End2End Setup Once', function () {
    it("can reset the app db and log in a user @watch", function () {
        e2e.resetMyApp();
        e2e.launchApp();
        e2e.loginUser(0);
        expect (e2e.isLoggedIn()).to.be.true;
    });
});
