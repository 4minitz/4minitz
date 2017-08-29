import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';

const insertMeetingSeriesMethod = 'meetingseries.insert';
const finalizeMinute = 'workflow.finalizeMinute';
const addTopic = 'minutes.addTopic';
const updateTopic = 'minutes.updateTopic';
const removeTopic = 'minutes.removeTopic';
const reopenTopic = 'workflow.reopenTopicFromMeetingSeries';
const topicSubject = 'Topic Security';
const newSubject = 'Updated Subject';

let createMeetingSeriesAndMinute = (name) => {
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    E2EMinutes.addMinutesToMeetingSeries(name, name);
    E2EMinutes.gotoLatestMinutes();
    return {
        min_id : E2EMinutes.getCurrentMinutesId(),
        ms_id : E2EMeetingSeries.getMeetingSeriesId(name, name),
    };
};

let tryAddNewTopic = (subject, topic_id, min_id, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(addTopic);
    E2ESecurity.executeMethod(addTopic, min_id, {subject: subject, labels: Array(0), _id: topic_id});
    expect((server.call('e2e.countTopicsInMongoDB', min_id)), testName).to.equal(expectToEqual);
};

let inviteUserToMeetingSerie = (MSname, role, userIndex) => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(MSname, MSname, 'invited');
    let user = E2EGlobal.SETTINGS.e2eTestUsers[userIndex];
    if (role === 'Invited')
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Invited);
    else
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Informed);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
};

let tryUpdateTopicSubject = (newSubject, topic_id, min_id, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(updateTopic);
    E2ESecurity.executeMethod(updateTopic, topic_id, {subject: newSubject});
    expect((server.call('e2e.getTopics', min_id))[0].subject, testName).to.equal(expectToEqual);
};

let tryRemoveTopic = (topic_id, min_id, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(removeTopic);
    E2ESecurity.executeMethod(removeTopic, topic_id);
    expect((server.call('e2e.countTopicsInMongoDB', min_id)), testName).to.equal(expectToEqual);
};

let tryReopenTopic = (topicID, meetingSeriesID, expectToBeOpened, testName) => {
    E2ESecurity.replaceMethodOnClientSide(reopenTopic);
    E2ESecurity.executeMethod(reopenTopic, meetingSeriesID, topicID);
    if (expectToBeOpened)
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen, testName).to.equal(true);
    else
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).topics[0].isOpen, testName).to.equal(false);
};

describe('Topics Methods Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    // minutes.addTopic
    it('Moderator can insert a new Topic, not logged in can not insert a topic', function () {
        const name = 'AddTopic as moderator';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', min.min_id);
        const topicId = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryAddNewTopic(topicSubject, topicId, min.min_id, numberOfTopics, 'not logged in user can not insert a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryAddNewTopic(topicSubject, topicId, min.min_id, numberOfTopics+1, 'Moderator can insert a topic');
    });


    it('Informed/Invited users can not insert a new Topic ', function () {
        const name = 'AddTopic as informed/invited';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', min.min_id);
        const topicId = E2ESecurity.returnMeteorId();

        inviteUserToMeetingSerie(name, 'Invited', 1);
        inviteUserToMeetingSerie(name, 'Informed', 2);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryAddNewTopic(topicSubject, topicId, min.min_id, numberOfTopics, 'Invited user can not insert a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryAddNewTopic(topicSubject, topicId, min.min_id, numberOfTopics, 'Informed user can not insert a topic');
        E2EApp.loginUser();
    });

    //minutes.updateTopic
    it('Moderator can update a Topic, not logged in user can not update a topic', function () {
        const name = 'UpdateTopic as moderator';
        const min = createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'not logged in user can not update a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateTopicSubject(newSubject, topicId, min.min_id, newSubject,'Moderator can update a topic');
    });


    it('Informed/Invited user in can not update a Topic', function () {
        const name = 'UpdateTopic as informed/invited';
        const min = createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        inviteUserToMeetingSerie(name, 'Invited', 1);
        inviteUserToMeetingSerie(name, 'Informed', 2);
        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'Invited user can not update a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'Informed user can not update a topic');
        E2EApp.loginUser();
    });

    //minutes.removeTopic
    it('Moderator can delete a Topic, not logged in can not delete a topic', function () {
        const name = 'RemoveTopic as moderator';
        const min = createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', min.min_id);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryRemoveTopic(topicId, min.min_id, numberOfTopics, 'not logged in user can not delete a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveTopic(topicId, min.min_id, numberOfTopics-1, 'moderator can delete a topic');
    });

    it('Informed/Invited users can not delete a topic', function () {
        const name = 'RemoveTopic as informed/invited';
        const min = createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        inviteUserToMeetingSerie(name, 'Invited', 1);
        inviteUserToMeetingSerie(name, 'Informed', 2);

        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        const numberOfTopics = server.call('e2e.countTopicsInMongoDB', min.min_id);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveTopic(topicId, min.min_id, numberOfTopics, 'Invited user can not delete a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveTopic(topicId, min.min_id, numberOfTopics, 'Informed user can not delete a topic');
        E2EApp.loginUser();
    });

    //'workflow.reopenTopicFromMeetingSeries'
    it('Moderator can reopen a topic ', function () {
        const name = 'ReopenTopic as moderator';
        const min = createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2ESecurity.executeMethod(updateTopic, topicId, {isOpen: false});
        expect((server.call('e2e.getTopics', min.min_id))[0].isOpen,).to.equal(false);

        E2ESecurity.executeMethod(finalizeMinute, min.min_id);
        expect((server.call('e2e.findMinute', min.min_id)).isFinalized,).to.equal(true);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryReopenTopic(topicId, min.ms_id, false, 'Not logged in can not reopen a topic');
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryReopenTopic(topicId, min.ms_id, true, 'Moderator can reopen a topic');
    });

    it('Invited/Informed user can not reopen a topic ', function () {
        const name = 'ReopenTopic as invited';
        const min = createMeetingSeriesAndMinute(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);
        inviteUserToMeetingSerie(name, 'Informed', 2);
        const topicId = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        E2ESecurity.executeMethod(updateTopic, topicId, {isOpen: false});
        expect((server.call('e2e.getTopics', min.min_id))[0].isOpen,).to.equal(false);

        E2ESecurity.executeMethod(finalizeMinute, min.min_id);
        expect((server.call('e2e.findMinute', min.min_id)).isFinalized,).to.equal(true);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryReopenTopic(topicId, min.ms_id, false, 'Invited user can not reopen a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryReopenTopic(topicId, min.ms_id, false, 'Informed user can not reopen a topic');
        E2EApp.loginUser();
    });
});
