import { expect } from 'chai';
import proxyquire from 'proxyquire';
import asyncStubs from '../../../support/lib/asyncStubs';

let fs = {
    readFile: asyncStubs.doNothing,
    '@noCallThru': true
};

const { loadLDAPSettings } = proxyquire('../../../../private/ldap/lib/loadLDAPSettings', {
    'fs': fs
});

describe('loadLDAPSettings', function () {
    beforeEach(function () {
        fs.readFile = asyncStubs.doNothing;
    });

    it('reads a file and resolves with the ldap configuration', function (done) {
        fs.readFile = asyncStubs.returns(2, '{"ldap": {"enabled": true}}');

        loadLDAPSettings('ldapSettings.json')
            .then((result) => {
                try {
                    expect(result.enabled).to.be.true;
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(new Error(error));
            });
    });

    it('handles file read errors gracefully', function (done) {
        fs.readFile = asyncStubs.returnsError(2, new Error('Could not read file'));

        loadLDAPSettings('ldapSettings.json')
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.deep.equal('Could not read settings file "ldapSettings.json"');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    it('handles json parse errors properly', function (done) {
        fs.readFile = asyncStubs.returns(2, 'no valid json');

        loadLDAPSettings('ldapSettings.json')
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.deep.equal('Could not parse json.');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    it('handles missing ldap settings', function (done) {
        fs.readFile = asyncStubs.returns(2, '{"noLdap": true}');

        loadLDAPSettings('ldapSettings.json')
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.deep.equal('Property "ldap" not found.');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    it('sets the process env to allow self signed tls certificates', function (done) {
        let settings = {
                ldap: {
                    allowSelfSignedTLS: true
                }
            },
            settingsJson = JSON.stringify(settings);

        fs.readFile = asyncStubs.returns(2, settingsJson);

        // enable rejection of unauthorized TLS certificates
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = 1;
        expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).to.equal('1');

        loadLDAPSettings('ldapSettings.json')
            .then(() => {
                try {
                    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).to.equal('0');
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
