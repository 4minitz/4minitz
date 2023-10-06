import { expect } from 'chai';

export class AssertHelper {

    static shouldThrow(action, message) {
        let exceptionCaught;
        try {
            action();
            exceptionCaught = false;
        } catch(ignored) {
            exceptionCaught = true;
        }
        expect(exceptionCaught, message).to.be.true;
    }

}
