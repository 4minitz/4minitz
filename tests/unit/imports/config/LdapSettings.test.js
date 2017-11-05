import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let Meteor = {
    settings: {
        ldap: {}
    }
};

const { LdapSettings } = proxyquire('../../../../imports/config/LdapSettings', {
    'meteor/meteor': { Meteor, '@noCallThru': true}
});

describe('LdapSettings', function () {
    describe('#check', function () {
        beforeEach(function () {
            Meteor.settings.ldap = {};
        });

        it('does not enable ldap if it is disabled', function () {
            Meteor.settings.ldap.enabled = false;

            LdapSettings.check();

            expect(LdapSettings.ldapEnabled()).to.be.false;
        });

        
    });
});
