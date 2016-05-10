import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from './../../imports/meetingseries'
import { UserEditConfig } from './../../imports/userEditConfig'

Template.meetingSeriesEdit.onCreated(function() {
    let thisMeetingSeriesID = this.data._id;

    // create client-only collection for storage of users attached
    // to this meeting series as input <=> output for the user editor
    let _attachedUsersCollection = new Mongo.Collection(null);

    // copy all attached users of this series to a new collection
    // and save their original _ids for later reference
    let visibleFor = this.data.visibleFor;
    for (let i in visibleFor) {
        let user = Meteor.users.findOne(visibleFor[i]);
        user._idOrg = user._id;
        delete user._id;
        _attachedUsersCollection.insert(user);
    }

    // build editor config and attach it to the instance of the template
    this.userEditConfig = new UserEditConfig("EDIT_SERIES", // mode
        thisMeetingSeriesID,                                      // the meeting series id
        _attachedUsersCollection);                          // collection of attached users
});

Template.meetingSeriesEdit.onRendered(function() {
    $.material.init();
});

Template.meetingSeriesEdit.onDestroyed(function() {
    //add your statement here
});

Template.meetingSeriesEdit.helpers({
    users: function () {
        return Meteor.users.find({});
    },

    userEditConfig: function () {
        return Template.instance().userEditConfig;
    }
});

Template.meetingSeriesEdit.events({

    "click #deleteMeetingSeries": function() {
        console.log("Remove Meeting Series: "+this._id);
        $('#dlgEditMeetingSeries').modal('hide');   // hide underlying modal dialog first, otherwise transparent modal layer is locked!

        let ms = new MeetingSeries(this._id);
        let countMinutes = ms.countMinutes();
        let seriesName = "<strong>" + ms.project + ": " + ms.name + "</strong>";
        let dialogContent = "<p>Do you really want to delete the meeting series " + seriesName + "?</p>";
        if (countMinutes !== 0) {
            let lastMinDate = ms.lastMinutes().date;
            dialogContent += "<p>This series contains " + countMinutes
                + " meeting minutes (last minutes of " + lastMinDate + ").</p>";
        }

        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                MeetingSeries.remove(ms);
                Router.go("/");
            },
            dialogContent
        );
    },
    
    
    "click #btnMeetingSeriesSave": function (evt, tmpl) {
        evt.preventDefault();

        console.log("SAVE: "+JSON.stringify(Template.instance().userEditConfig.users.find().fetch()));

        var aProject = tmpl.find("#id_meetingproject").value;
        var aName = tmpl.find("#id_meetingname").value;

        // validate form and show errors
        let projectNode = tmpl.$("#id_meetingproject");
        let nameNode = tmpl.$("#id_meetingname");
        projectNode.parent().removeClass("has-error");
        nameNode.parent().removeClass("has-error");
        if (aProject == "") {
            projectNode.parent().addClass("has-error");
            projectNode.focus();
            return;
        }
        if (aName == "") {
            nameNode.parent().addClass("has-error");
            nameNode.focus();
            return;
        }

        ms = new MeetingSeries(this._id);
        ms.project = aProject;
        ms.name = aName;
        ms.save();

        // Hide modal dialog
        $('#dlgEditMeetingSeries').modal('hide');
    }
});
