import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

let Meteor = {
    startup: sinon.mock(),
    settings: {
        ldap: {}
    }
};
let LDAP = {};

const { ldap } = proxyquire('../../../server/ldap', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    'meteor/babrahams:accounts-ldap': { LDAP, '@noCallThru': true},
});

describe('ldap', function () {
    describe('#bindValue', function () {
        beforeEach(function () {
            Meteor.settings = {
                ldap: {
                    enabled: true
                }
            };
        });

        it('generates a dn based on the configuration and the given username', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                serverDn: "dc=example,dc=com",
            });

            let isEmail = false;
            let username = 'username';

            let result = LDAP.bindValue(username, isEmail);

            expect(result).to.equal('test=username,dc=example,dc=com');
        });

        it('removes the host part if an email address is given', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                serverDn: "dc=example,dc=com",
            });

            let isEmail = true;
            let username = 'username@example.com';

            let result = LDAP.bindValue(username, isEmail);

            expect(result).to.equal('test=username,dc=example,dc=com');
        });

        it('returns an empty string if the configuration is missing', function () {
            delete Meteor.settings;

            let result = LDAP.bindValue();

            expect(result).to.equal('');
        });

        it('returns an empty string if the ldap configuration is missing', function () {
            delete Meteor.settings.ldap;

            let result = LDAP.bindValue();

            expect(result).to.equal('');
        });

        it('returns an empty string if ldap is not enabled', function () {
            Meteor.settings.ldap.enabled = false;

            let result = LDAP.bindValue();

            expect(result).to.equal('');
        });

        it('returns an empty string if serverDn is not set', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test"
            });

            let result = LDAP.bindValue();

            expect(result).to.equal('');
        });

        it('returns an empty string if searchDn is not set', function () {
            _.extend(Meteor.settings.ldap, {
                serverDn: "dc=example,dc=com"
            });

            let result = LDAP.bindValue();

            expect(result).to.equal('');
        });
    });

    describe('#filter', function () {
        beforeEach(function () {
            Meteor.settings = {
                ldap: {
                    enabled: true
                }
            };
        });

        it('generates a dn based on the configuration and the given username', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                searchFilter: ""
            });

            let isEmail = false;
            let username = 'username';

            let result = LDAP.filter(isEmail, username);

            expect(result).to.equal('(&(test=username))');
        });

        it('removes the host part if an email address is given', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                searchFilter: ""
            });

            let isEmail = true;
            let username = 'username@example.com';

            let result = LDAP.filter(isEmail, username);

            expect(result).to.equal('(&(test=username))');
        });

        it('still works if searchFilter is undefined', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                searchFilter: undefined
            });

            let isEmail = false;
            let username = 'username';

            let result = LDAP.filter(isEmail, username);

            expect(result).to.equal('(&(test=username))');
        });

        it('appends the searchFilter configuration to the filter', function () {
            _.extend(Meteor.settings.ldap, {
                searchDn: "test",
                searchFilter: "(objectClass=user)"
            });

            let isEmail = false;
            let username = 'username';

            let result = LDAP.filter(isEmail, username);

            expect(result).to.equal('(&(test=username)(objectClass=user))');
        });

        it('returns an empty string if the configuration is missing', function () {
            delete Meteor.settings;

            let result = LDAP.filter();

            expect(result).to.equal('');
        });

        it('returns an empty string if the ldap configuration is missing', function () {
            delete Meteor.settings.ldap;

            let result = LDAP.filter();

            expect(result).to.equal('');
        });

        it('returns an empty string if ldap is not enabled', function () {
            Meteor.settings.ldap.enabled = false;

            let result = LDAP.filter();

            expect(result).to.equal('');
        });

        it('returns an empty string if searchDn is not set', function () {
            let result = LDAP.filter();

            expect(result).to.equal('');
        });
    });

    describe('#log', function () {
        beforeEach(function () {
            sinon.spy(console, 'log');
        });

        afterEach(function () {
            console.log.restore();
        });

        it('forwards the message to the console', function () {
            let message = 'something';

            LDAP.log(message);

            expect(console.log.calledOnce).to.be.true;
        });

        it('blocks messages starting with \'Creating user\'', function () {
            let message = 'Creating user ...';

            LDAP.log(message);

            expect(console.log.called).to.be.false;
        });
    });
});
