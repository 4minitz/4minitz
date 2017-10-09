/* USAGE INSTRUCTION:
 To call tests: simply import the TestRunner into your .js file and use the run method of this class
 To add tests: have a look at the TestCase class. Simply add more tests by expanding the createTestCases-Method.
 To add new scenarios triggering tests: simply add an unique identifier for your scenario to TestRunner.TRIGGERS, then create your tests.
 */
import {ConfirmationDialogFactory} from '../../client/helpers/confirmationDialogFactory';

export class TestRunner {
    static TRIGGERS = { // if you want to add new scenarios triggering test, add one unique string identifier here.
        finalize: 'finalize',
        sendAgenda: 'sendAgenda'
    };

    static generateList(selectedTrigger){
        if (TestCase.testCases.length === 0) {
            TestCase.createTestCases();
        }

        //filter test cases
        let selectedTests = TestCase.testCases.filter((testCase) => {
            return (testCase.triggers.includes(selectedTrigger) &&
            (testCase.condition()));
        });

        return selectedTests;
    }

    static run(selectedTrigger, testObject, callbackOnSuccess) {
        //create test cases
        if (TestCase.testCases.length === 0) {
            TestCase.createTestCases();
        }

        //filter test cases
        let selectedTests = TestCase.testCases.filter((testCase) => {
            return (testCase.triggers.includes(selectedTrigger) &&
            (testCase.condition()));
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
            // TODO: Write errors into template and put the callbackOnSuccess into the confirmationDialogFactorys successcallback
            errors.forEach(error => console.log(error));
            ConfirmationDialogFactory.makeWarningDialogWithTemplate(
                callbackOnSuccess,
                'Minute quality warning',
                'confirmPlainText',
                { plainText: 'Got some errors bois'},
                'Proceed'
            ).show();
        }
    }
}

class TestCase {
    static testCases = [];

    constructor(testName, triggers, condition, test) {
        this.testName = testName; //name of the test for list generation
        this.triggers = triggers; //to determine to which scenarios applies
        this.condition = condition; //checks if the test is to be run at all. For future purposes e.g. disabling tests via settings
        this.test = test; // the test itself. Receives the minute object as a parameter, returns a string if the test fails, otherwise undefined
    }

    static createTestCases() {
        // to add tests simply push a new TestCase Object to the testCases property

        // no topics in minute
        TestCase.testCases.push(new TestCase(
            'No topics in minute',
            [TestRunner.TRIGGERS.finalize, TestRunner.TRIGGERS.sendAgenda],
            () => {return true;},
            (minute) => {
                if ((!minute.topics) || (minute.topics.length === 0))
                    return 'This minute has no topics';
            }
        ));

        // no participant marked as present
        TestCase.testCases.push(new TestCase('No participants marked as present',
            TestRunner.TRIGGERS.finalize,
            () => {return true;},
            (minute) => {
                let noParticipantsPresent = true;
                minute.participants.forEach(p => {
                    if(p.present) noParticipantsPresent = false;
                    }
                );
                if(noParticipantsPresent)
                    return 'No participant is marked as present'
            }
        ));
    }
}