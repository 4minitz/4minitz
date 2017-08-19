import { E2EGlobal } from './E2EGlobal'

export class E2ESecurity {
    //Many of the security-e2e-tests will simulate a hacker-attack by calling meteor methods directly.
    //Thus the names of the called meteor methods are hardcoded in the e2e-Tests and have to be updated if a method is renamed.
    //In order to check this, all security-e2e-tests should use this function to check if the methods called within them do still exist. 
    //If that's not the case, the test will fail and by this give a hint for the dev, which test cases have yet to be updated with the new method name.
    static expectMethodToExist(methodName){
        let methodExists = browser.execute( function(methodName) {
            //The methodHandlers-Dictionary will contain all meteor methods known to the client.
            //By default it will contain exactly the same methods as the server
            return typeof Meteor.connection._methodHandlers[methodName] === 'function'
        },methodName).value;
        expect(methodExists, 'Method ' + methodName + ' exists').to.be.true;
    }
    
    //Due too Meteor's nature most method calls will result in an execution both on the client and the server.
    //Therefore all security related mechanisms within these methods will be checked on the client and the server.
    //As a hacker it is not possible to manipulate the server's execution of the methods, but the client one can be.
    //This is done by overwriting the local client copy of the method with an empty method stump containing no checks anymore and therefore always being executed successfully.
    //By doing this only the server-side security mechanisms remain which should of course still stop unauthorized actions.
    static replaceMethodOnClientSide(methodName) {
        browser.execute( function(methodName) {
            //The methodHandlers-Dictionary contains the client's copy of the meteor methods. 
            //By changing the function for a specific meteor method all future calls of this method for this session will execute the changed function.
            Meteor.connection._methodHandlers[methodName] = function () {console.log('Modified Client Method: ' + methodName);};
        }, methodName);
    }
    
    //Due to the asynchronous execution of most meteor methods and the necessarity to check their specific results within security-e2e-tests it is necessary
    //to wrap these method calls with the following function, allowing for an emulated synchronous usage of these methods.
    static executeMethod(methodName, ...methodParameters) {
        E2ESecurity.expectMethodToExist(methodName);
        browser.timeoutsAsyncScript(5000);
        let result = browser.executeAsync((methodName, methodParameters, done) => {
            Meteor.apply(methodName, methodParameters, _ => {
            }, (error, result) => {
                done({error, result});
            });
        }, methodName, methodParameters);
        console.log(`Results are in: error = ${result.value.error}, result = ${result.value.result}`);
    }

    static countRecordsInMiniMongo(collectionName) {
        return browser.execute((collectionName) => {
            let collectionpointer = Meteor.Collection.get(collectionName);
            return collectionpointer ? collectionpointer.find().count() : 0;
        }, collectionName).value;
    }

    static returnMeteorId(){
        let id = browser.execute(function () {
            return Random.id();
        });
        return id.value;
    }
}