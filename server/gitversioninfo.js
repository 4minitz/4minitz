GIT_VERSION_INFO = {
    branch: "???",
    tag: "???",
    commitlong: "???",
    commitshort: "???"
};

try {
    var git = require('git-rev');

    console.log("");
    git.short(function (str) {
        console.log('git.short', str);
        GIT_VERSION_INFO.commitshort = str;
    });

    git.long(function (str) {
        console.log('git.long', str);
        GIT_VERSION_INFO.commitlong = str;
    });

    git.branch(function (str) {
        console.log('git.branch', str);
        GIT_VERSION_INFO.branch = str;
    });

    git.tag(function (str) {
        console.log('git.tag', str);
        GIT_VERSION_INFO.tag = str;
    });
} catch (e) {
    console.log("No git-rev installed? Do 'meteor npm install --save' before launch of meteor!");
}


Meteor.methods({
    gitVersionInfo: function () {
        return GIT_VERSION_INFO;
    }
});
