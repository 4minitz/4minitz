import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'

describe('Topics Security', function () {
    const insertMeetingSeriesMethod = 'meetingseries.insert';
    const addMinutes = 'workflow.addMinutes';
    const addTopic = 'minutes.addTopic';
    const updateTopic = 'minutes.updateTopic';
    const removeTopic = 'minutes.removeTopic';
    const reopenTopic = 'workflow.reopenTopicFromMeetingSeries';


    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    // minutes.addTopic
    it('Moderator can insert a new Topic, not logged in can not insert a topic', function () {
        const aProjectName = "AddTopic as moderator";
        const aMeetingName = "AddTopic as moderator";
        expect (E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Moderator';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'not logged in user can not insert a topic').to.equal(numberOfTopics);

        E2EApp.loginUser();
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'Moderator can insert a topic').to.equal(numberOfTopics+1);
    });


    it('Informed/Invited users can not insert a new Topic ', function () {
        const aProjectName = "AddTopic as informed/invited";
        const aMeetingName = "AddTopic as informed/invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Informed/Invited';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'Invited user can not insert a topic').to.equal(numberOfTopics);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'Informed user can not insert a topic').to.equal(numberOfTopics);

        E2EApp.loginUser();
    });

    //minutes.updateTopic
    it('Moderator can update a Topic, not logged in user can not update a topic', function () {
        const aProjectName = "UpdateTopic as moderator";
        const aMeetingName = "UpdateTopic as moderator";
        expect (E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const oldSubject = 'Topic Moderator';
        const newSubject = 'Updated Subject';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: oldSubject, labels: Array(0), _id: id});
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(updateTopic);
        E2ESecurity.executeMethod(updateTopic, topicID, {subject: newSubject});
        expect((server.call('e2e.getTopics', minuteID))[0].subject,
            'not logged in user can not update a topic').to.equal(oldSubject);

        E2EApp.loginUser();
        E2ESecurity.replaceMethodOnClientSide(updateTopic);
        E2ESecurity.executeMethod(updateTopic, topicID, {subject: newSubject});
        expect((server.call('e2e.getTopics', minuteID))[0].subject,
            'Moderator can update a topic').to.equal(newSubject);
    });


    it('Informed/Invited user in can not update a Topic', function () {
        const aProjectName = "UpdateTopic as informed/invited";
        const aMeetingName = "UpdateTopic as informed/invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const oldSubject = 'Topic informed/invited';
        const newSubject = 'Updated Subject';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: oldSubject, labels: Array(0), _id: id});
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(updateTopic);
        E2ESecurity.executeMethod(updateTopic, topicID, {subject: newSubject});
        expect((server.call('e2e.getTopics', minuteID))[0].subject,
            'Invited user can not update a topic').to.equal(oldSubject);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        E2ESecurity.replaceMethodOnClientSide(updateTopic);
        E2ESecurity.executeMethod(updateTopic, topicID, {subject: newSubject});
        expect((server.call('e2e.getTopics', minuteID))[0].subject,
            'Informed user can not update a topic').to.equal(oldSubject);

        E2EApp.loginUser();
    });

    //minutes.removeTopic
    // Meteor.call('minutes.removeTopic', 'RjcaFN2mwxvFEwLyH')
    it('Moderator can delete a Topic, not logged in can not delete a topic', function () {
        expect (E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "RemoveTopic as moderator";
        const aMeetingName = "RemoveTopic as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Moderator';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(removeTopic);
        E2ESecurity.executeMethod(removeTopic, topicID);
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'not logged in user can not delete a topic').to.equal(numberOfTopics);

        E2EApp.loginUser();
        E2ESecurity.replaceMethodOnClientSide(removeTopic);
        E2ESecurity.executeMethod(removeTopic, topicID);
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'moderator can delete a topic').to.equal(numberOfTopics-1);
    });

    it('Informed/Invited users can not delete a topic', function () {
        const aProjectName = "RemoveTopic as informed/invited";
        const aMeetingName = "RemoveTopic as informed/invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic informed/invited';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(removeTopic);
        E2ESecurity.executeMethod(removeTopic, topicID);
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'Invited user can not delete a topic').to.equal(numberOfTopics);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        E2ESecurity.replaceMethodOnClientSide(removeTopic);
        E2ESecurity.executeMethod(removeTopic, topicID);
        expect((server.call('e2e.countTopicsInMongoDB', minuteID)),
            'Informed user can not delete a topic').to.equal(numberOfTopics);

        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    //'workflow.reopenTopicFromMeetingSeries'
    it('Moderator can reopen a topic ', function () {
        const aProjectName = "ReopenTopic as moderator";
        const aMeetingName = "ReopenTopic as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic moderator';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;
        E2ESecurity.executeMethod(updateTopic, topicID, {isOpen: false});
        expect((server.call('e2e.getTopics', minuteID))[0].isOpen,).to.equal(false);

        E2EMinutes.finalizeCurrentMinutes();
        expect((server.call('e2e.findMinute', minuteID)).isFinalized,).to.equal(true);

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(reopenTopic);
        E2ESecurity.executeMethod(reopenTopic, meetingSeriesID, topicID);
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen,
            'Not logged in can not reopen a topic').to.equal(false);

        E2EApp.loginUser();
        E2ESecurity.executeMethod(reopenTopic, meetingSeriesID, topicID);
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen,
            'Moderator can reopen a topic').to.equal(true);

    });

    it('Invited/Informed user can not reopen a topic ', function () {
        const aProjectName = "ReopenTopic as invited";
        const aMeetingName = "ReopenTopic as invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic invited';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        const topicID = (server.call('e2e.getTopics', minuteID))[0]._id;
        E2ESecurity.executeMethod(updateTopic, topicID, {isOpen: false});
        expect((server.call('e2e.getTopics', minuteID))[0].isOpen,).to.equal(false);

        E2EMinutes.finalizeCurrentMinutes();
        expect((server.call('e2e.findMinute', minuteID)).isFinalized,).to.equal(true);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(reopenTopic);
        E2ESecurity.executeMethod(reopenTopic, meetingSeriesID, topicID);
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen,
            'Invited user can not reopen a topic').to.equal(false);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        E2ESecurity.executeMethod(reopenTopic, meetingSeriesID, topicID);
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen,
            'Informed user can not reopen a topic').to.equal(false);

        E2EApp.loginUser();
    });



    });
