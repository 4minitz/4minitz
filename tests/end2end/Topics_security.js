import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';

const topicSubject = 'Topic Security';
const newSubject = 'Updated Subject';


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
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.tryAddNewTopic(topicSubject, topicId, min.min_id, 0, 'not logged in user can not insert a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryAddNewTopic(topicSubject, topicId, min.min_id, 1, 'Moderator can insert a topic');
    });


    it('Informed/Invited users can not insert a new Topic', function () {
        const name = 'AddTopic as informed/invited';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();

        E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        E2ESecurity.inviteUserToMeetingSerie(name, 'Informed', 2);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryAddNewTopic(topicSubject, topicId, min.min_id, 0, 'Invited user can not insert a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryAddNewTopic(topicSubject, topicId, min.min_id, 0, 'Informed user can not insert a topic');
        E2EApp.loginUser();
    });

    //minutes.updateTopic
    it('Moderator can update a Topic, not logged in user can not update a topic', function () {
        const name = 'UpdateTopic as moderator';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'not logged in user can not update a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryUpdateTopicSubject(newSubject, topicId, min.min_id, newSubject,'Moderator can update a topic');
    });


    it('Informed/Invited user in can not update a Topic', function () {
        const name = 'UpdateTopic as informed/invited';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        E2ESecurity.inviteUserToMeetingSerie(name, 'Informed', 2);
        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'Invited user can not update a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryUpdateTopicSubject(newSubject, topicId, min.min_id, topicSubject, 'Informed user can not update a topic');
        E2EApp.loginUser();
    });

    //minutes.removeTopic
    it('Moderator can delete a Topic, not logged in can not delete a topic', function () {
        const name = 'RemoveTopic as moderator';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        expect(server.call('e2e.countTopicsInMongoDB', min.min_id)).to.equal(1);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.tryRemoveTopic(topicId, min.min_id, 1, 'not logged in user can not delete a topic');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryRemoveTopic(topicId, min.min_id, 0, 'moderator can delete a topic');
    });

    it('Informed/Invited users can not delete a topic', function () {
        const name = 'RemoveTopic as informed/invited';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        E2ESecurity.inviteUserToMeetingSerie(name, 'Informed', 2);

        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        expect(server.call('e2e.countTopicsInMongoDB', min.min_id)).to.equal(1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryRemoveTopic(topicId, min.min_id, 1, 'Invited user can not delete a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryRemoveTopic(topicId, min.min_id, 1, 'Informed user can not delete a topic');
        E2EApp.loginUser();
    });

    //'workflow.reopenTopicFromMeetingSeries'
    it('Moderator can reopen a topic, not logged in can not reopen a topic', function () {
        const name = 'ReopenTopic as moderator';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        const topicId = E2ESecurity.returnMeteorId();
        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});

        E2ESecurity.executeMethod(E2ESecurity.updateTopic, topicId, {isOpen: false});
        expect((server.call('e2e.getTopics', min.min_id))[0].isOpen).to.equal(false);

        E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
        expect((server.call('e2e.findMinute', min.min_id)).isFinalized).to.equal(true);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.tryReopenTopic(topicId, min.ms_id, false, 'Not logged in can not reopen a topic');
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryReopenTopic(topicId, min.ms_id, true, 'Moderator can reopen a topic');
    });

    it('Invited/Informed user can not reopen a topic', function () {
        const name = 'ReopenTopic as invited';
        const min = E2ESecurity.createMeetingSeriesAndMinute(name);
        E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        E2ESecurity.inviteUserToMeetingSerie(name, 'Informed', 2);
        const topicId = E2ESecurity.returnMeteorId();

        E2ESecurity.executeMethod(E2ESecurity.addTopic, min.min_id, {subject: topicSubject, labels: Array(0), _id: topicId});
        E2ESecurity.executeMethod(E2ESecurity.updateTopic, topicId, {isOpen: false});
        expect((server.call('e2e.getTopics', min.min_id))[0].isOpen).to.equal(false);

        E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
        expect((server.call('e2e.findMinute', min.min_id)).isFinalized).to.equal(true);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryReopenTopic(topicId, min.ms_id, false, 'Invited user can not reopen a topic');

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.tryReopenTopic(topicId, min.ms_id, false, 'Informed user can not reopen a topic');
        E2EApp.loginUser();
    });
});
