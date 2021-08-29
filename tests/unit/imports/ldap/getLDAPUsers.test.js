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
            callback({ object: { uid: 'foo' } });
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

const getLDAPUsers = proxyquire('../../../../imports/ldap/getLDAPUsers', {
    'ldapjs': ldap
});

describe('getLDAPUsers', function () {
    let settings;

    const expectedSuccessfulResult = [{ uid: 'foo', isInactive: false }];

    beforeEach(function () {
        ldap.createClient.resetHistory();
        settings = {
            propertyMap: {},
            whiteListedFields: [],
            inactiveUsers: {
                strategy: 'none'
            }
        };
    });

    it('uses ldapjs to connect to ldap and gets users', function (done) {
        let client = {
            search: asyncStubs.returns(2, ldapSearchResponseWithResult),
            unbind: asyncStubs.returns(0, {})
        };
        ldap.createClient.returns(client);

        getLDAPUsers(settings)
            .then((result) => {
                try {
                    expect(result.users).to.deep.equal(expectedSuccessfulResult);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(error);
            });
    });

    it('handles connection errors to ldap properly', function (done) {
        ldap.createClient.throws(new Error('Some connection error'));

        getLDAPUsers(settings)
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

        getLDAPUsers(settings)
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

        getLDAPUsers(settings)
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

        getLDAPUsers(settings)
            .then((result) => {
                try {
                    expect(result.users).to.deep.equal(expectedSuccessfulResult);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(new Error(error));
            });
    });

    describe('legacy inactive user detection settings', function (done) {
        let client;

        beforeEach(function () {
            ldap.createClient.resetHistory();
        });

        const ldapSearchResult = (activeValue) => {
                return {
                    on: (event, callback) => {
                        if (event === 'searchEntry') {
                            callback({ object: { active: activeValue } });
                        }

                        if (event === 'end') {
                            callback();
                        }
                    }
                };
            },
            settings = {
                isInactivePredicate: {
                    active: 'no'
                }
            };

        it('returns user object with isInactive property set to true', function (done) {
            let client = {
                search: asyncStubs.returns(2, ldapSearchResult('no')),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users[0].isInactive).to.deep.equal(true);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => {
                    done(error2);
                });
        });

        it('adds property map attributes to whitelist automatically', function (done) {
            const s = Object.assign({}, settings, {
                propertyMap: {
                    username: 'someweirdAttribute',
                    email: 'anEmailAttribute'
                },
                whiteListedFields: ['someField']
            });
            let parameters = [];
            let client = {
                search: asyncStubs.returns(2, ldapSearchResult('no'), parameters),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(s)
                .then((result) => {
                    try {
                        const parametersOfFirstCall = parameters[0],
                            options = parametersOfFirstCall['1'];
                        expect(options.attributes).to.include.members(['someweirdAttribute', 'anEmailAttribute']);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => {
                    done(error2);
                });
        });

        it('returns user object with isInactive property set to false', function (done) {
            let client = {
                search: asyncStubs.returns(2, ldapSearchResult('yes')),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users[0].isInactive).to.deep.equal(false);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => {
                    done(error2);
                });
        });    });

    describe('inactive user detection strategy: none', function (done) {
        const activeUsers = [{ isInactive: false, uid: 'foo' }];
        it('returns user object with isInactive property set to false', function (done) {
            const settings = {
                inactiveUsers: {
                    strategy: 'none'
                }
            };

            let client = {
                search: asyncStubs.returns(2, ldapSearchResponseWithResult),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users).to.deep.equal(activeUsers);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => {
                    done(error2);
                });
        });

        it('uses the none strategy if an invalid strategy is given', function (done) {
            const settings = {
                inactiveUsers: {
                    strategy: 'doesnotexist'
                }
            };

            let client = {
                search: asyncStubs.returns(2, ldapSearchResponseWithResult),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users).to.deep.equal(activeUsers);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => {
                    done(error2);
                });
        });
    });

    describe('inactive user detection strategy: UAC', function () {
        let client;

        const activeUsers = false,
            inactiveUsers = true,
            ldapSearchResponseWithGivenUACValue = (uac) => {
                return {
                    on: (event, callback) => {
                        if (event === 'searchEntry') {
                            callback({ object: { userAccountControl: uac } });
                        }

                        if (event === 'end') {
                            callback();
                        }
                    }
                }
            },
            generateTestCase = (value, expectedResult) => {
                return function (done) {
                    const settings = {
                        inactiveUsers: {
                            strategy: 'userAccountControl'
                        }
                    };

                    client = {
                        search: asyncStubs.returns(2, ldapSearchResponseWithGivenUACValue(value)),
                        unbind: asyncStubs.returnsError(0, 'Some error')
                    };
                    ldap.createClient.returns(client);

                    getLDAPUsers(settings)
                        .then((result) => {
                            try {
                                expect(result.users[0].isInactive).to.equal(expectedResult);
                                done();
                            } catch (error) {
                                done(error);
                            }
                        })
                        .catch((error) => done(error));
                }
            };

        beforeEach(function () {
            ldap.createClient.resetHistory();
        });

        for (let i = 0; i < 32; ++i) {
            const value = Math.pow(2, i),
                expectedResult = (i === 1 ? inactiveUsers : activeUsers);
            it(`uAC property set to ${value}: returns user object with isInactive === ${expectedResult}`, generateTestCase(value, expectedResult));
        }
    });

    describe('inactive user detection strategy: property', function () {
        let client;

        beforeEach(function () {
            ldap.createClient.resetHistory();
        });

        const ldapSearchResponseWithGivenAttribute = (attribute, value) => {
                return {
                    on: (event, callback) => {
                        if (event === 'searchEntry') {
                            callback({ object: { [attribute]: value } });
                        }

                        if (event === 'end') {
                            callback();
                        }
                    }
                };
            };

        it('returns isInactive == true if given property is set to requested value', function (done) {
            const settings = {
                inactiveUsers: {
                    strategy: 'property',
                    properties: {
                        active: '1'
                    }
                }
            };

            client = {
                search: asyncStubs.returns(2, ldapSearchResponseWithGivenAttribute('active', '1')),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users[0].isInactive).to.equal(true);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => done(error));
        });

        it('returns isInactive == false if given property is not set to requested value', function (done) {
            const settings = {
                inactiveUsers: {
                    strategy: 'property',
                    properties: {
                        active: '1'
                    }
                }
            };

            client = {
                search: asyncStubs.returns(2, ldapSearchResponseWithGivenAttribute('active', '2')),
                unbind: asyncStubs.returnsError(0, 'Some error')
            };
            ldap.createClient.returns(client);

            getLDAPUsers(settings)
                .then((result) => {
                    try {
                        expect(result.users[0].isInactive).to.equal(false);
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .catch((error) => done(error));
        });
    });
});
