import { E2EGlobal } from './E2EGlobal'

const resultSessionVariableName = 'LastMethodCallResult';
const errorSessionVariableName = 'LastMethodCallError';

export class E2ESecurity {
    static expectMethodToExist(methodName){
        let methodExists = browser.execute( function(methodName) {
            return typeof Meteor.connection._methodHandlers[methodName] === 'function'
            
        },methodName).value;
        expect(methodExists, 'Method ' + methodName + ' exists').to.be.true;
    }
    
    static replaceMethodOnClientSide(methodName) {
        browser.execute( function(methodName) {
            Meteor.connection._methodHandlers[methodName] = function () {console.log('Modified Client Method: ' + methodName);};
        }, methodName);
    }

    static executeMethode(methodName, methodParameters){
        browser.timeoutsAsyncScript(5000);
        let result = browser.executeAsync((methodName, methodParameters, done) => {
            Meteor.call(methodName, methodParameters, _ => {}, (error, result) => {
                done({error, result});
            });
        }, methodName, methodParameters);
        console.log(`Results are in: error = ${result.value.error}, result = ${result.value.result}`);
    }

}
