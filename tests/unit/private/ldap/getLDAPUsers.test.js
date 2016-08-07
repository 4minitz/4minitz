import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import asyncStubs from '../../../support/lib/asyncStubs';

let ldap = {
    createClient: sinon.stub(),
    '@noCallThru': true
};

let ldapSearchResponseWithResult = {
    on: (event, callback) => {
        if (event === 'searchEntry') {
            callback({object: true});
        }

        if (event === 'end') {
            callback();
        }
    }
};

let ldapSearchResponseWithError = {
    on: (event, callback) => {
        if (event === 'error') {
            callback('Some error');
        }
    }
};

const { getLDAPUsers } = proxyquire('../../../../private/ldap/lib/getLDAPUsers', {
    'ldapjs': ldap
});

describe('getLDAPUsers', function () {
    beforeEach(function () {
        ldap.createClient.reset();
    });

    it('uses ldapjs to connect to ldap and gets users', function (done) {
        let client = {
            search: asyncStubs.returns(2, ldapSearchResponseWithResult),
            unbind: asyncStubs.returns(0, {})
        };
        ldap.createClient.returns(client);

        getLDAPUsers({})
            .then((result) => {
                try {
                    expect(result.users).to.deep.equal([true]);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(new Error(error));
            });
    });

    it('handles connection errors to ldap properly', function (done) {
        ldap.createClient.throws(new Error('Some connection error'));

        getLDAPUsers({})
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.equal('Error creating client: Error: Some connection error');
                    done();
                } catch (error) {
                    done(error);
                }

            });
    });

    it('handles ldap search errors properly', function (done) {
        let client = {
            search: asyncStubs.returns(2, ldapSearchResponseWithError),
            unbind: asyncStubs.returns(0, {})
        };
        ldap.createClient.returns(client);

        getLDAPUsers({})
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.equal('Some error');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    it('handles ldap search errors properly', function (done) {
        let client = {
            search: asyncStubs.returns(2, ldapSearchResponseWithError),
            unbind: asyncStubs.returns(0, {})
        };
        ldap.createClient.returns(client);

        getLDAPUsers({})
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.equal('Some error');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    it('ignores errors during unbind', function (done) {
        let client = {
            search: asyncStubs.returns(2, ldapSearchResponseWithResult),
            unbind: asyncStubs.returnsError(0, 'Some error')
        };
        ldap.createClient.returns(client);

        getLDAPUsers({})
            .then((result) => {
                try {
                    expect(result.users).to.deep.equal([true]);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(new Error(error));
            });

    });
});
