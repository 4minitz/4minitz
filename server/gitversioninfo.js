import { Meteor } from 'meteor/meteor'
let packagejson = require ("/package.json");

GIT_VERSION_INFO = {
    branch: "???",
    tag: packagejson.version ? packagejson.version : "???",
    commitlong: "???",
    commitshort: "???"
};

Meteor.methods({
    gitVersionInfo: function () {
        return GIT_VERSION_INFO;
    },

    gitVersionInfoUpdate: function () {
        try {
            var git = require('git-rev-sync');
            GIT_VERSION_INFO.commitshort = git.short();
            GIT_VERSION_INFO.commitlong = git.long();
            GIT_VERSION_INFO.branch = git.branch();
            GIT_VERSION_INFO.tag = git.tag();
            if (GIT_VERSION_INFO.tag == GIT_VERSION_INFO.commitlong) {  // no tag found!
                delete GIT_VERSION_INFO.tag;
            }

            console.log("git version:"+JSON.stringify(GIT_VERSION_INFO, null, 4));

        } catch (e) {
            console.log("No git-rev-sync installed? Do 'meteor npm install' before launch of meteor!");
            console.log(e);
        }
    }
});


Meteor.call("gitVersionInfoUpdate");
