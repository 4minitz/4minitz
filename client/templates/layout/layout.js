
let recalcMobileWidth = function () {
    if ($(window).width() <= 400) {
        Session.set("global.isMobileWidth", true);
    } else {
        Session.set("global.isMobileWidth", false);
    }
};



Template.appLayout.onCreated(function() {
    recalcMobileWidth();
    $(window).resize(function() {
        recalcMobileWidth();
    });
});

Template.appLayout.onDestroyed(function() {
    $(window).off('resize');
});

