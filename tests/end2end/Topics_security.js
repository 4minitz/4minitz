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


    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    // minutes.addTopic
    it('Moderator can insert a new Topic', function () {
        //Meteor.call("minutes.addTopic", 'asRRSyfsPGFGPnNyu', {subject: "erwqe", labels: Array(0), _id: Random.id()});
        const aProjectName = "AddTopic as moderator";
        const aMeetingName = "AddTopic as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Moderator';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID))).to.equal(numberOfTopics+1);
    });

    it('Not logged in user can not insert a new Topic ', function () {
        const aProjectName = "AddTopic as not logged in";
        const aMeetingName = "AddTopic as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Not logged in';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID))).to.equal(numberOfTopics);
    });

    it('Invited user can not insert a new Topic ', function () {
        const aProjectName = "AddTopic as invited";
        const aMeetingName = "AddTopic as invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Invited';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID))).to.equal(numberOfTopics);
    });

    it('Informed user can not insert a new Topic ', function () {
        const aProjectName = "AddTopic as informed";
        const aMeetingName = "AddTopic as informed";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Informed';
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', minuteID);
        const id = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(addTopic);
        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        expect((server.call('e2e.countTopicsInMongoDB', minuteID))).to.equal(numberOfTopics);
    });

    //minutes.updateTopic
    //Meteor.call("minutes.updateTopic", '8BRfdsRgm4M3ETnwJ', {subject: "erwqewtwtwt", labels: Array(0)});

    it('Moderator can update a Topic ', function () {
        const aProjectName = "UpdateTopic as moderator";
        const aMeetingName = "UpdateTopic as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const subject = 'Topic Moderator';
        const newSubject = 'Updated Subject';
        const id = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, minuteID, {subject: subject, labels: Array(0), _id: id});
        const topicID = (server.call('e2e.findTopic', minuteID, 0))._id;

        E2ESecurity.replaceMethodOnClientSide(updateTopic);
        E2ESecurity.executeMethod(updateTopic, topicID, {subject: newSubject});
        expect((server.call('e2e.findTopic', minuteID, 0)).subject).to.equal(newSubject);
    });


    });
