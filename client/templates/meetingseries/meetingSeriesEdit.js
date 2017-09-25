import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { Mongo } from 'meteor/mongo';
import { FlowRouter } from 'meteor/kadira:flow-router';

import {ConfirmationDialogFactory} from '../../helpers/confirmationDialogFactory';
import { handleError } from '/client/helpers/handleError';

import { MeetingSeries } from '/imports/meetingseries';
import { UsersEditConfig } from './meetingSeriesEditUsers';
import { UserRoles } from '/imports/userroles';
import { Minutes } from '/imports/minutes';


Template.meetingSeriesEdit.onCreated(function() {
    let thisMeetingSeriesID = FlowRouter.getParam('_id');
    //Check if this dialog was not called by a meetingseries but by a minute
    if (!MeetingSeries.findOne(thisMeetingSeriesID))
        thisMeetingSeriesID = Minutes.findOne(thisMeetingSeriesID).parentMeetingSeriesID();

    // create client-only collection for storage of users attached
    // to this meeting series as input <=> output for the user editor
    let _attachedUsersCollection = new Mongo.Collection(null);

    // build editor config and attach it to the instance of the template
    this.userEditConfig = new UsersEditConfig(
        true,                                               // current user can not be edited
        thisMeetingSeriesID,                                // the meeting series id
        _attachedUsersCollection);                          // collection of attached users
    // Hint: collection will be filled in the "show.bs.modal" event below
});

Template.meetingSeriesEdit.helpers({
    users: function () {
        return Meteor.users.find({});
    },

    userEditConfig: function () {
        return Template.instance().userEditConfig;
    },

    labelsConfig: function() {
        return {
            meetingSeriesId: this._id
        };
    }
});

// This function handles notification on role changes if the
// moderator checked the according check box in the meeting series editor
// It does so by comparing the users & roles before and after usage of the editor.
const notifyOnRoleChange = function(usersWithRolesAfterEdit, meetingSeriesId) {
    function sendEmail (userId, oldRole, newRole, meetingSeriesId) {
        Meteor.call('meetingseries.sendRoleChange', userId, oldRole, newRole, meetingSeriesId);
    }

    let usersBeforeEdit = this.visibleFor.concat(this.informedUsers);
    let usersWithRolesAfterEditForEmails = usersWithRolesAfterEdit.slice();
    let moderator = new UserRoles(Meteor.userId());

    for (let i in usersBeforeEdit) {
        let oldUserId = usersBeforeEdit[i];
        let oldUserWithRole = new UserRoles(oldUserId);
        let oldUserRole = oldUserWithRole.currentRoleFor(meetingSeriesId);

        // Search in after edit users whether the users still exists
        let matchingUser = usersWithRolesAfterEditForEmails.find(function (user) {
            return oldUserWithRole._userId === user._idOrg;
        });

        // If he does not, his role was removed
        if (matchingUser === undefined) {
            if (oldUserWithRole._userId !== moderator._userId) {
                sendEmail(oldUserWithRole.getUser()._id, oldUserRole, undefined, meetingSeriesId);
            }
        } else {
            let newUserWithRole = new UserRoles(matchingUser._idOrg);
            let newUserRole = matchingUser.roles[meetingSeriesId][0];
            let index = usersWithRolesAfterEditForEmails.indexOf(matchingUser);

            // Roles have changed
            if (newUserRole !== oldUserRole) {
                sendEmail(newUserWithRole.getUser()._id, oldUserRole, newUserRole, meetingSeriesId);
            }
            usersWithRolesAfterEditForEmails.splice(index, 1);
        }
    }
    // The remaining users in the after-edit-array -> got added
    for (let i in usersWithRolesAfterEditForEmails) {
        let newUser = usersWithRolesAfterEditForEmails[i];
        let newUserRole = newUser.roles[meetingSeriesId][0];
        if (moderator._userId !== newUser._idOrg) {
            sendEmail(newUser._idOrg, undefined, newUserRole, meetingSeriesId);
        }
    }
};


Template.meetingSeriesEdit.events({

    'click #deleteMeetingSeries': function() {
        console.log('Remove Meeting Series: '+this._id);
        $('#dlgEditMeetingSeries').modal('hide');   // hide underlying modal dialog first, otherwise transparent modal layer is locked!

        let ms = new MeetingSeries(this._id);

        let deleteSeriesCallback = () => {
            MeetingSeries.remove(ms).catch(handleError);
            FlowRouter.go('/');
        };

        const confirmationDialog = ConfirmationDialogFactory.makeWarningDialogWithTemplate(
            deleteSeriesCallback,
            'Confirm delete',
            'confirmationDialogDeleteSeries',
            {
                project: ms.project,
                name: ms.name,
                hasMinutes: (ms.minutes.length !== 0),
                minutesCount: ms.minutes.length,
                lastMinutesDate: (ms.minutes.length !== 0) ? ms.lastMinutesDate : false
            }
        );

        Meteor.setTimeout(() => {
            confirmationDialog.show();
        }, 0);

    },


    // "show" event is fired shortly before BootStrap modal dialog will pop up
    // We fill the temp. client-side only user database for the user editor on this event
    'show.bs.modal #dlgEditMeetingSeries': function (evt, tmpl) {

        let lockState = false;

        if ((tmpl.data.isEditedBy !== undefined && tmpl.data.isEditedDate !== undefined)) {
            lockState = true;

            let resetEdited = function () {
                lockState = false;

                /*
                MeetingSeriesSchema.update({_id: tmpl.data._id}, {$unset: {isEditedBy: "", isEditedDate: ""}});
                let ms = new MeetingSeries(tmpl.data._id);
                console.log(ms);
                */

                let ms = new MeetingSeries(tmpl.data._id);
                ms.removeEdit();
                console.log(ms);

                delete tmpl.data.isEditedBy;
                delete tmpl.data.isEditedDate;
                $('#dlgEditMeetingSeries').modal('show');
            }

            let user = Meteor.users.findOne({_id: tmpl.data.isEditedBy});

            let tmplData = {
                isEditedBy: user.username,
                isEditedDate: tmpl.data.isEditedDate
            };

            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                resetEdited,
                'Edit despite existing editing',
                'confirmationDialogResetEdit',
                tmplData,
                'Edit anyway'
                ).show();
        }

        if (lockState === true) {
            evt.preventDefault();
            return
        }

        const ms = new MeetingSeries(tmpl.data._id);
        if (ms.isEditedBy === undefined && ms.isEditedDate === undefined) {
            ms.isEditedBy = Meteor.userId();
            ms.isEditedDate = new Date();
            ms.save()
        }

        // Make sure these init values are filled in a close/re-open scenario
        $('#btnMeetingSeriesSave').prop('disabled',false);
        $('#btnMeetinSeriesEditCancel').prop('disabled',false);
        tmpl.find('#id_meetingproject').value = this.project;
        tmpl.find('#id_meetingname').value = this.name;

        Template.instance().userEditConfig.users.remove({});    // first: clean up everything!

        // copy all attached users of this series to the temp. client-side user collection
        // and save their original _ids for later reference
        for (let i in this.visibleFor) {
            let user = Meteor.users.findOne(this.visibleFor[i]);
            user._idOrg = user._id;
            delete user._id;
            Template.instance().userEditConfig.users.insert(user);
        }
        // now the same for the informed users
        for (let i in this.informedUsers) {
            let user = Meteor.users.findOne(this.informedUsers[i]);
            user._idOrg = user._id;
            delete user._id;
            Template.instance().userEditConfig.users.insert(user);
        }
    },

    'shown.bs.modal #dlgEditMeetingSeries': function (evt, tmpl) {
        // switch to "invited users" tab once, if desired
        if (Session.get('meetingSeriesEdit.showUsersPanel') === true) {
            Session.set('meetingSeriesEdit.showUsersPanel', false);
            $('#btnShowHideInvitedUsers').click();
            Meteor.setTimeout(function () {
                tmpl.find('#edt_AddUser').focus();
            }, 500);

        } else {
            $('#dlgEditMeetingSeries input').trigger('change');   // ensure new values trigger placeholder animation
            tmpl.find('#id_meetingproject').focus();
        }
    },

    'submit #frmDlgEditMeetingSeries': function(evt, tmpl) {
        evt.preventDefault();
        let saveButton = $('#btnMeetingSeriesSave');
        let cancelButton = $('btnMeetinSeriesEditCancel');
        saveButton.prop('disabled',true);
        cancelButton.prop('disabled',true);

        let aProject = tmpl.find('#id_meetingproject').value;
        let aName = tmpl.find('#id_meetingname').value;
        let modWantsNotifyOnRoleChange = tmpl.find('#checkBoxRoleChange').checked;

        // validate form and show errors - necessary for browsers which do not support form-validation
        let projectNode = tmpl.$('#id_meetingproject');
        let nameNode = tmpl.$('#id_meetingname');
        projectNode.parent().removeClass('has-error');
        nameNode.parent().removeClass('has-error');
        if (aProject === '') {
            projectNode.parent().addClass('has-error');
            projectNode.focus();
            return;
        }
        if (aName === '') {
            nameNode.parent().addClass('has-error');
            nameNode.focus();
            return;
        }

        let usersWithRolesAfterEdit = Template.instance().userEditConfig.users.find().fetch();
        let allVisiblesArray = [];
        let allInformedArray = [];
        let meetingSeriesId = this._id;

        if (modWantsNotifyOnRoleChange) {
            notifyOnRoleChange.call(this, usersWithRolesAfterEdit, meetingSeriesId);
        }

        for (let i in usersWithRolesAfterEdit) {
            let usrAfterEdit = usersWithRolesAfterEdit[i];
            let newRole = new UserRoles(usrAfterEdit._idOrg);     // Attention: get back to Id of Meteor.users collection

            newRole.saveRoleForMeetingSeries(meetingSeriesId, usrAfterEdit.roles[meetingSeriesId]);
            if (UserRoles.isVisibleRole(usrAfterEdit.roles[meetingSeriesId])) {
                allVisiblesArray.push(usrAfterEdit._idOrg);  // Attention: get back to Id of Meteor.users collection
            } else {
                allInformedArray.push(usrAfterEdit._idOrg);  // Attention: get back to Id of Meteor.users collection
            }
        }

        const ms = new MeetingSeries(meetingSeriesId);
        ms.project = aProject;
        ms.name = aName;
        ms.setVisibleAndInformedUsers(allVisiblesArray,allInformedArray);   // this also removes the roles of removed users
        ms.save();

        // Hide modal dialog
        saveButton.prop('disabled',false);
        cancelButton.prop('disabled',false);
        $('#dlgEditMeetingSeries').modal('hide');
    },


    'click #btnMeetingSeriesSave': function (evt, tmpl) {
        evt.preventDefault();
        // Unfortunately the form.submit()-function does not trigger the
        // validation process
        tmpl.$('#submitMeetingSeriesEditForm').click();
    },

    // Prevent the last open panel to be collapsible
    'click .panel-heading a': function (evt) {
        if($(evt.target).parents('.panel').children('.panel-collapse').hasClass('in')){
            evt.stopPropagation();
        }
        evt.preventDefault();
    }
});
