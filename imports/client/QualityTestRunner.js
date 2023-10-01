/* USAGE INSTRUCTION:
 To call tests: simply import the QualityTestRunner into your .js file and use the run method of this class
 To add tests: have a look at the TestCase class. Simply add more tests by expanding the createTestCases-Method.
 To add new scenarios triggering tests: simply add an unique identifier for your scenario to QualityTestRunner.TRIGGERS, then create your tests.
 */
import { ConfirmationDialogFactory } from "../../client/helpers/confirmationDialogFactory";
import { i18n } from "meteor/universe:i18n";

export class QualityTestRunner {
  static TRIGGERS = {
    // if you want to add new scenarios triggering test, add one unique string identifier here.
    finalize: "finalize",
    sendAgenda: "sendAgenda",
  };

  static generateList() {
    if (QualityTestCase.testCases.length === 0) {
      QualityTestCase.createTestCases();
    }

    return QualityTestCase.testCases;
  }

  static generateSpecificList(selectedTrigger) {
    if (QualityTestCase.testCases.length === 0) {
      QualityTestCase.createTestCases();
    }

    //filter test cases
    return QualityTestCase.testCases.filter((testCase) => {
      return testCase.triggers.includes(selectedTrigger);
    });
  }

  static run(selectedTrigger, testObject, callbackOnSuccess) {
    //create test cases
    if (QualityTestCase.testCases.length === 0) {
      QualityTestCase.createTestCases();
    }

    //filter test cases
    let selectedTests = QualityTestCase.testCases.filter((testCase) => {
      return (
        testCase.triggers.includes(selectedTrigger) && testCase.condition()
      );
    });

    //execute tests
    let errors = [];
    selectedTests.forEach((selectedTest) => {
      let error = selectedTest.test(testObject);
      if (error) {
        errors.push(error);
      }
    });

    //check if errors occured
    if (errors.length === 0) {
      callbackOnSuccess();
    } else {
      ConfirmationDialogFactory.makeWarningDialogWithTemplate(
        callbackOnSuccess,
        i18n.__("Dialog.ConfirmMinuteQualityAssurance.title"),
        "confirmMinuteQualityAssurance",
        { errors: errors },
        i18n.__("Dialog.ConfirmMinuteQualityAssurance.button"),
      ).show();
    }
  }
}

class QualityTestCase {
  static testCases = [];

  constructor(testName, triggers, condition, test) {
    this.testName = testName; //name of the test for list generation
    this.triggers = triggers; //to determine to which scenarios applies
    this.condition = condition; //checks if the test is to be run at all. For future purposes e.g. disabling tests via settings
    this.test = test; // the test itself. Receives the minute object as a parameter, returns a string if the test fails, otherwise undefined
  }

  static createTestCases() {
    // to add tests simply push a new TestCase Object to the testCases property

    // no topics in minute (F) (A)
    QualityTestCase.testCases.push(
      new QualityTestCase(
        "No topics in minute",
        [
          QualityTestRunner.TRIGGERS.finalize,
          QualityTestRunner.TRIGGERS.sendAgenda,
        ],
        () => {
          return true;
        },
        (minute) => {
          if (!minute.topics || minute.topics.length === 0)
            return i18n.__("Dialog.ConfirmMinuteQualityAssurance.warnNoTopics");
        },
      ),
    );

    // no participant marked as present (F)
    QualityTestCase.testCases.push(
      new QualityTestCase(
        "No participants marked as present",
        QualityTestRunner.TRIGGERS.finalize,
        () => {
          return true;
        },
        (minute) => {
          let noParticipantsPresent = true;
          minute.participants.forEach((p) => {
            if (p.present) noParticipantsPresent = false;
          });
          if (noParticipantsPresent)
            return i18n.__(
              "Dialog.ConfirmMinuteQualityAssurance.warnNoParticipants",
            );
        },
      ),
    );
    /*
        // an item is still edited (F)
        QualityTestCase.testCases.push(new QualityTestCase('An item is still edited',
            QualityTestRunner.TRIGGERS.finalize,
            () => {return true;},
            (minute) => {
                let itemIsEdited = false;
                for (let topic of minute.topics) {
                    if (topic.isEditedBy !== undefined || topic.isEditedDate !== undefined) {
                        itemIsEdited = true;
                        break;
                    }
                    for (let infoItem of topic.infoItems) {
                        if (infoItem.isEditedBy !== undefined || infoItem.isEditedDate !== undefined) {
                            itemIsEdited = true;
                            break;
                        }
                        for (let detail of infoItem.details) {
                            if (detail.isEditedBy !== undefined || detail.isEditedDate !== undefined) {
                                itemIsEdited = true;
                                break;
                            }
                        }
                    }
                }
                if(itemIsEdited)
                    return i18n.__('Dialog.ConfirmMinuteQualityAssurance.warnEditing');;
            }
        ));
*/
    // no topics checked (F)
    QualityTestCase.testCases.push(
      new QualityTestCase(
        "No topic is checked",
        QualityTestRunner.TRIGGERS.finalize,
        () => {
          return true;
        },
        (minute) => {
          if (minute.topics.length === 0) return;
          let noTopicChecked = true;
          minute.topics.forEach((topic) => {
            if (!topic.isOpen) noTopicChecked = false;
          });
          if (noTopicChecked)
            return i18n.__(
              "Dialog.ConfirmMinuteQualityAssurance.warnNoTopicDiscussed",
            );
        },
      ),
    );

    // topic checked but no children (F)
    QualityTestCase.testCases.push(
      new QualityTestCase(
        "A topic is checked but has no children",
        QualityTestRunner.TRIGGERS.finalize,
        () => {
          return true;
        },
        (minute) => {
          if (minute.topics.length === 0) return;

          let checkedButChildren = false;
          minute.topics.forEach((topic) => {
            if (topic.isOpen) return;
            if (!topic.infoItems || topic.infoItems.length === 0)
              checkedButChildren = true;
          });
          if (checkedButChildren)
            return i18n.__(
              "Dialog.ConfirmMinuteQualityAssurance.warnTopicWithoutItems",
            );
        },
      ),
    );

    // action item with no responsible (F)
    QualityTestCase.testCases.push(
      new QualityTestCase(
        "Action item has no responsible",
        QualityTestRunner.TRIGGERS.finalize,
        () => {
          return true;
        },
        (minute) => {
          if (minute.topics.length === 0) return;

          let actionItemWithoutResponsible = false;
          minute.topics.forEach((topic) => {
            topic.infoItems.forEach((infoItem) => {
              if (
                infoItem.itemType === "actionItem" &&
                (!infoItem.responsibles || infoItem.responsibles.length === 0)
              )
                actionItemWithoutResponsible = true;
            });
          });
          if (actionItemWithoutResponsible)
            return i18n.__(
              "Dialog.ConfirmMinuteQualityAssurance.warnActionItemWithoutResponsible",
            );
        },
      ),
    );

    // Topic checked, but no updated or new content (F)
    /* uncomment when details get a isNew-Property for easier code
         QualityTestCase.testCases.push(new QualityTestCase('Topic is checked, but has no updated or new content',
         QualityTestRunner.TRIGGERS.finalize,
            () => {return true;},
            (minute) => {
                if(minute.topics.length < 0) return;
                let noNewContent = true;
                minute.topics.forEach(topic => {
                    console.log(topic)
                    if(topic.isNew) { // topic is new
                        noNewContent = false;
                        return;
                    }

                    topic.infoItems.forEach(infoItem => {
                        if(infoItem.isNew) { // infoItem is new
                            noNewContent = false;
                            return;
                        }

                        if(!infoItem.isSticky) return; // only sticky infoItems can have new content in their details
                            infoItem.details.forEach(detail => { // detail is new
                               if(detail.isNew)
                                   noNewContent = true;
                            });

                        });
                });
                if(!noNewContent)
                    return i18n.__('Dialog.ConfirmMinuteQualityAssurance.warnTopicNoNewContent');
            }
        ));
        */
  }
}
