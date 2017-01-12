import { GlobalSettings } from "/imports/GlobalSettings";
let recalcMobileWidth = function () {
    if ($(window).width() < 768) {
        Session.set("global.isMobileWidth", true);
    } else {
        Session.set("global.isMobileWidth", false);
    }
};

Template.appLayout.helpers({
    "showGitHubCorner": function () {
        return GlobalSettings.showGithubCorner();
    }
});


Template.appLayout.onCreated(function() {
    recalcMobileWidth();
    $(window).resize(function() {
        recalcMobileWidth();
    });
});

Template.appLayout.onDestroyed(function() {
    $(window).off('resize');
});

