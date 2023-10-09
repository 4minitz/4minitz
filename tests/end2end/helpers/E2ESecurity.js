import { E2EGlobal } from "./E2EGlobal";
import { E2EMeetingSeries } from "./E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./E2EMeetingSeriesEditor";
import { E2EMinutes } from "./E2EMinutes";

export class E2ESecurity {
  static insertMeetingSeriesMethod = "meetingseries.insert";
  static updateMinutes = "minutes.update";
  static addMinutes = "workflow.addMinutes";
  static removeMinute = "workflow.removeMinute";
  static finalizeMinute = "workflow.finalizeMinute";
  static unfinalizeMinute = "workflow.unfinalizeMinute";
  static removeMeetingSeriesMethod = "workflow.removeMeetingSeries";
  static updateMeetingSeriesMethod = "meetingseries.update";
  static addTopic = "minutes.addTopic";
  static updateTopic = "minutes.updateTopic";
  static removeTopic = "minutes.removeTopic";
  static reopenTopic = "workflow.reopenTopicFromMeetingSeries";
  static saveRoleForMeetingSeries = "userroles.saveRoleForMeetingSeries";
  static removeAllRolesForMeetingSeries =
    "userroles.removeAllRolesForMeetingSeries";

  // Many of the security-e2e-tests will simulate a hacker-attack by calling
  // meteor methods directly. Thus the names of the called meteor methods are
  // hardcoded in the e2e-Tests and have to be updated if a method is renamed.
  // In order to check this, all security-e2e-tests should use this function to
  // check if the methods called within them do still exist. If that's not the
  // case, the test will fail and by this give a hint for the dev, which test
  // cases have yet to be updated with the new method name.
  static expectMethodToExist(methodName) {
    const methodExists = browser.execute(
      (methodName) =>
        typeof Meteor.connection._methodHandlers[methodName] === "function",
      methodName,
    ).value;
    expect(methodExists, `Method ${methodName} exists`).to.be.true;
  }

  // Due too Meteor's nature most method calls will result in an execution both
  // on the client and the server. Therefore all security related mechanisms
  // within these methods will be checked on the client and the server. As a
  // hacker it is not possible to manipulate the server's execution of the
  // methods, but the client one can be. This is done by overwriting the local
  // client copy of the method with an empty method stump containing no checks
  // anymore and therefore always being executed successfully. By doing this
  // only the server-side security mechanisms remain which should of course
  // still stop unauthorized actions.
  static replaceMethodOnClientSide(methodName) {
    browser.execute((methodName) => {
      // The methodHandlers-Dictionary contains the client's copy of the meteor
      // methods. By changing the function for a specific meteor method all
      // future calls of this method for this session will execute the changed
      // function.
      Meteor.connection._methodHandlers[methodName] = () => {
        console.log(`Modified Client Method: ${methodName}`);
      };
    }, methodName);
  }

  // Due to the asynchronous execution of most meteor methods and the
  // necessarity to check their specific results within security-e2e-tests it is
  // necessary to wrap these method calls with the following function, allowing
  // for an emulated synchronous usage of these methods.
  static executeMethod(methodName, ...methodParameters) {
    E2ESecurity.expectMethodToExist(methodName);
    browser.timeouts("script", 5000);
    try {
      const result = browser.executeAsync(
        (methodName, methodParameters, done) => {
          Meteor.apply(
            methodName,
            methodParameters,
            (_) => {},
            (error, result) => {
              done({ error, result });
            },
          );
        },
        methodName,
        methodParameters,
      );
      // console.log(`Results are in: error = ${result.value.error}, result =
      // ${result.value.result}`);
    } catch (e) {
      console.log(`Exception in executeMethod(): ${e.message}`);
    }
  }

  static countRecordsInMiniMongo(collectionName) {
    return browser.execute((collectionName) => {
      const collectionpointer = Meteor.Collection.get(collectionName);
      return collectionpointer ? collectionpointer.find().count() : 0;
    }, collectionName).value;
  }

  static returnMeteorId() {
    return browser.execute(() => Random.id()).value;
  }

  static createMeetingSeriesAndMinute = (name) => {
    E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {
      project: name,
      name,
    });
    const msID = E2EMeetingSeries.getMeetingSeriesId(name, name);
    E2EMinutes.addMinutesToMeetingSeries(name, name);
    E2EMinutes.gotoLatestMinutes();
    return {
      min_id: E2EMinutes.getCurrentMinutesId(),
      ms_id: msID,
      date: E2EMinutes.getCurrentMinutesDate(),
    };
  };

  static tryFinalizeMinute = (minuteID, expectToBeFinalized) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.finalizeMinute);
    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minuteID);
    expect(server.call("e2e.findMinute", minuteID).isFinalized).to.equal(
      expectToBeFinalized,
    );
  };

  static createMeetingSeries = (name) => {
    E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {
      project: name,
      name,
    });
    return E2EMeetingSeries.getMeetingSeriesId(name, name);
  };

  static tryUpdateCurrentMinuteDate = (
    minuteID,
    newDate,
    expectToEqualDate,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.updateMinutes);
    E2ESecurity.executeMethod(E2ESecurity.updateMinutes, {
      _id: minuteID,
      date: newDate,
    });
    expect(server.call("e2e.findMinute", minuteID).date).to.equal(
      expectToEqualDate,
    );
  };

  static tryAddNewMinute = (
    meetingSeriesID,
    date,
    expectToEqualNumberMinutes,
    userIdex,
  ) => {
    const userid = server.call("e2e.getUserId", userIdex);
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.addMinutes);
    E2ESecurity.executeMethod(E2ESecurity.addMinutes, {
      meetingSeries_id: meetingSeriesID,
      date,
      visibleFor: [userid],
    });
    expect(server.call("e2e.countMinutesInMongoDB")).to.equal(
      expectToEqualNumberMinutes,
    );
  };

  static tryRemoveMinute = (minuteID, expectToEqualNumberMinutes) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeMinute);
    E2ESecurity.executeMethod(E2ESecurity.removeMinute, minuteID);
    expect(server.call("e2e.countMinutesInMongoDB")).to.equal(
      expectToEqualNumberMinutes,
    );
  };

  static tryUnfinalizeMinute = (minuteID, expectToBeUnfinalized) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.unfinalizeMinute);
    E2ESecurity.executeMethod(E2ESecurity.unfinalizeMinute, minuteID);
    expect(server.call("e2e.findMinute", minuteID).isFinalized).to.equal(
      expectToBeUnfinalized,
    );
  };

  static inviteUserToMeetingSerie = (MSname, role, userIndex) => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(MSname, MSname, "invited");
    const user = E2EGlobal.SETTINGS.e2eTestUsers[userIndex];
    if (role === "Invited")
      E2EMeetingSeriesEditor.addUserToMeetingSeries(
        user,
        E2EGlobal.USERROLES.Invited,
      );
    else
      E2EMeetingSeriesEditor.addUserToMeetingSeries(
        user,
        E2EGlobal.USERROLES.Informed,
      );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
  };

  static tryInsertMeetingSeries = (name, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(
      E2ESecurity.insertMeetingSeriesMethod,
    );
    E2ESecurity.executeMethod(E2ESecurity.insertMeetingSeriesMethod, {
      project: name,
      name,
    });
    expect(server.call("e2e.countMeetingSeriesInMongDB"), testName).to.equal(
      expectToEqual,
    );
  };

  static tryDeleteMeetingSeries = (
    meetingSeriesID,
    expectToEqual,
    testName,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(
      E2ESecurity.removeMeetingSeriesMethod,
    );
    E2ESecurity.executeMethod(
      E2ESecurity.removeMeetingSeriesMethod,
      meetingSeriesID,
    );
    expect(server.call("e2e.countMeetingSeriesInMongDB"), testName).to.equal(
      expectToEqual,
    );
  };

  static tryUpdateMeetingSeriesName = (
    meetingSeriesID,
    newName,
    expectToEqual,
    testName,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(
      E2ESecurity.updateMeetingSeriesMethod,
    );
    E2ESecurity.executeMethod(E2ESecurity.updateMeetingSeriesMethod, {
      _id: meetingSeriesID,
      name: newName,
    });
    expect(
      server.call("e2e.findMeetingSeries", meetingSeriesID).name,
      testName,
    ).to.equal(expectToEqual);
  };

  static tryAddNewTopic = (
    subject,
    topic_id,
    min_id,
    expectToEqual,
    testName,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.addTopic);
    E2ESecurity.executeMethod(E2ESecurity.addTopic, min_id, {
      subject,
      labels: Array(0),
      _id: topic_id,
    });
    expect(server.call("e2e.countTopicsInMongoDB", min_id), testName).to.equal(
      expectToEqual,
    );
  };

  static tryUpdateTopicSubject = (
    newSubject,
    topic_id,
    min_id,
    expectToEqual,
    testName,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.updateTopic);
    E2ESecurity.executeMethod(E2ESecurity.updateTopic, topic_id, {
      subject: newSubject,
    });
    expect(server.call("e2e.getTopics", min_id)[0].subject, testName).to.equal(
      expectToEqual,
    );
  };

  static tryRemoveTopic = (topic_id, min_id, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.removeTopic);
    E2ESecurity.executeMethod(E2ESecurity.removeTopic, topic_id);
    expect(server.call("e2e.countTopicsInMongoDB", min_id), testName).to.equal(
      expectToEqual,
    );
  };

  static tryReopenTopic = (
    topicID,
    meetingSeriesID,
    expectToBeOpened,
    testName,
  ) => {
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.reopenTopic);
    E2ESecurity.executeMethod(
      E2ESecurity.reopenTopic,
      meetingSeriesID,
      topicID,
    );
    E2EGlobal.waitSomeTime();
    const topicsOfSeries = server.call(
      "e2e.getTopicsOfMeetingSeries",
      meetingSeriesID,
    );
    expect(topicsOfSeries[0].isOpen, testName).to.equal(expectToBeOpened);
  };

  static tryUpdateRole = (
    meetingSeriesID,
    userIndex,
    newRole,
    expectToEqual,
  ) => {
    const userID = server.call("e2e.getUserId", userIndex);
    E2ESecurity.replaceMethodOnClientSide(E2ESecurity.saveRoleForMeetingSeries);
    E2ESecurity.executeMethod(
      E2ESecurity.saveRoleForMeetingSeries,
      userID,
      meetingSeriesID,
      newRole,
    );
    expect(server.call("e2e.getUserRole", meetingSeriesID, userIndex)).to.equal(
      expectToEqual,
    );
  };

  static tryRemoveRole = (meetingSeriesID, userIndex, expectToEqual) => {
    const userID = server.call("e2e.getUserId", userIndex);
    E2ESecurity.replaceMethodOnClientSide(
      E2ESecurity.removeAllRolesForMeetingSeries,
    );
    E2ESecurity.executeMethod(
      E2ESecurity.removeAllRolesForMeetingSeries,
      userID,
      meetingSeriesID,
    );
    expect(server.call("e2e.getUserRole", meetingSeriesID, userIndex)).to.equal(
      expectToEqual,
    );
  };
}
