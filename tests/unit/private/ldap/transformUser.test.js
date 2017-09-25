import { expect } from 'chai';
import transformUser from '../../../../imports/ldap/transformUser';

describe('transformUser', function () {
    it('defaults to cn for the username when no searchDn is given', function () {
        let ldapSettings = {},
            userData = {
                cn: 'username'
            };

        let meteorUser = transformUser(ldapSettings, userData);

        expect(meteorUser.username).to.equal(userData.cn);
    });

    it('uses the configured attribute as username', function () {
        let ldapSettings = {
                propertyMap: {
                    username: 'attr'
                }
            },
            userData = {
                cn: 'wrongUsername',
                attr: 'username'
            };

        let meteorUser = transformUser(ldapSettings, userData);

        expect(meteorUser.username).to.equal(userData.attr);
    });

    it('uses the given email if given as string', function () {
        let ldapSettings = {},
            userData = {
                mail: 'me@example.com'
            };

        let meteorUser = transformUser(ldapSettings, userData);

        let expectedResult = [{
            address: userData.mail,
            verified: true,
            fromLDAP: true
        }];
        expect(meteorUser.emails).to.deep.equal(expectedResult);
    });

    it('uses the first email if given an array', function () {
        let ldapSettings = {},
            userData = {
                mail: ['me@example.com', 'me2@example.com']
            };

        let meteorUser = transformUser(ldapSettings, userData);

        let expectedResult = [{
            address: userData.mail[0],
            verified: true,
            fromLDAP: true
        }];
        expect(meteorUser.emails).to.deep.equal(expectedResult);
    });

    it('copies over the value of the users profile cn attribute as the profile name', function () {
        let ldapSettings = {},
            profile = {
                cn: 'user name'
            },
            userData = {profile};

        let meteorUser = transformUser(ldapSettings, userData);

        expect(meteorUser.profile.name).to.equal(userData.cn);
    });

    it('copies nothing into the user\'s profile if no whitelisted fields are given', function () {
        let ldapSettings = {},
            userData = {
                someAttribute: 'someValue',
                anotherAttribute: 2
            };

        let meteorUser = transformUser(ldapSettings, userData);

        expect(meteorUser.profile).to.deep.equal({});
    });

    it('copies over the attributes given as whitelistedFields into the user\'s profile', function () {
        let ldapSettings = {
                whiteListedFields: ['someAttribute', 'anotherAttribute']
            },
            userData = {
                someAttribute: 'someValue',
                anotherAttribute: 2,
                anUnexpectedAttribute: true
            };

        let meteorUser = transformUser(ldapSettings, userData);

        let expectedResult = {
            someAttribute: 'someValue',
            anotherAttribute: 2
        };
        expect(meteorUser.profile).to.deep.equal(expectedResult);
    });
});
