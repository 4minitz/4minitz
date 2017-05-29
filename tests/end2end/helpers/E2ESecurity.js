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
	
	static callMethodWithCallback(expectToFail, methodName, ...methodParameters) {
		//------------------------------------------------------
		// NEW CODE: Fancy but not working
		//------------------------------------------------------
		browser.execute(function(expectToFail, methodName, methodParameters) {
				Meteor.apply(methodName, methodParameters, {}, function(error, result) {
					if (expectToFail && !error) {
						expect.fail('By calling the method ' + methodName + ' an error was expected but did not occur'); 
					}
					if (!expectToFail && error) {
						expect.fail('Error within method call for ' + methodName + ':  ' + error.reason); 
					}
					console.log('DEKA');
					done();
				});
            }, expectToFail, methodName, methodParameters);
		//------------------------------------------------------
		//OLD CODE: Working but stupid
		//------------------------------------------------------
		/*
		// This function uses session variables to transmit data between the client, the server and the test runner
        // it will return an object with two properties, the error and the result of the called method        
        browser.execute( function(methodName, methodParameters, resultSessionVariableName, errorSessionVariableName) {
            //Clear Session Variables to determine the methods end by the changes in the session variables
            Session.set(resultSessionVariableName, undefined);
            Session.set(errorSessionVariableName, undefined);
            //Execute Method, use apply instead of call to transmit the method parameters as an Array
            Meteor.apply(methodName, methodParameters, {}, function(error, result) {
                //Client callback sets the session variables
                Session.set(resultSessionVariableName, result);
                Session.set(errorSessionVariableName, error);
            });            
        }, methodName, methodParameters, resultSessionVariableName, errorSessionVariableName);
        //Wait for execution of callback
        let getResult = () => {
            return browser.execute( function(resultSessionVariableName) {
                return Session.get(resultSessionVariableName);
            },resultSessionVariableName).value;
        }
        let getError = () => {
            return browser.execute( function(errorSessionVariableName) {
                return Session.get(errorSessionVariableName);
            },errorSessionVariableName).value;
        }
        let result = getResult();
        let error = getError();
        for (let i = 0; (i < 5000) && !(error || result) ; i += 500) { //timeout after 5 Secs
            E2EGlobal.waitSomeTime(500);
            result = getResult();
            error = getError();
        }
        //catch timeout of method
        expect(!!result || !!error, 'Method ' + methodName + ' was executed in time').to.be.true;
        //return error and result, one of them has to be filled
        return { result : result, error: error}
    }
		*/
	}
}
