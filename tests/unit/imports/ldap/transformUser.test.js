import { expect } from "chai";
import transformUser from "../../../../imports/ldap/transformUser";

describe("transformUser", () => {
  it("defaults to cn for the username when no searchDn is given", () => {
    let ldapSettings = {},
      userData = {
        cn: "username",
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.username).to.equal(userData.cn);
  });

  it("uses the configured attribute as username", () => {
    let ldapSettings = {
        propertyMap: {
          username: "attr",
        },
      },
      userData = {
        cn: "wrongUsername",
        attr: "username",
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.username).to.equal(userData.attr);
  });

  it("uses the given email if given as string", () => {
    let ldapSettings = {},
      userData = {
        mail: "me@example.com",
      };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = [
      {
        address: userData.mail,
        verified: true,
        fromLDAP: true,
      },
    ];
    expect(meteorUser.emails).to.deep.equal(expectedResult);
  });

  it("uses the first email if given an array", () => {
    let ldapSettings = {},
      userData = {
        mail: ["me@example.com", "me2@example.com"],
      };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = [
      {
        address: userData.mail[0],
        verified: true,
        fromLDAP: true,
      },
    ];
    expect(meteorUser.emails).to.deep.equal(expectedResult);
  });

  it("copies over the value of the users profile cn attribute as the profile name", () => {
    let ldapSettings = {},
      profile = {
        cn: "user name",
      },
      userData = { profile };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.profile.name).to.equal(userData.cn);
  });

  it("copies nothing into the user's profile if no whitelisted fields are given", () => {
    let ldapSettings = {},
      userData = {
        someAttribute: "someValue",
        anotherAttribute: 2,
      };

    const meteorUser = transformUser(ldapSettings, userData);

    expect(meteorUser.profile).to.deep.equal({});
  });

  it("copies over the attributes given as whitelistedFields into the user's profile", () => {
    let ldapSettings = {
        whiteListedFields: ["someAttribute", "anotherAttribute"],
      },
      userData = {
        someAttribute: "someValue",
        anotherAttribute: 2,
        anUnexpectedAttribute: true,
      };

    const meteorUser = transformUser(ldapSettings, userData);

    const expectedResult = {
      someAttribute: "someValue",
      anotherAttribute: 2,
    };
    expect(meteorUser.profile).to.deep.equal(expectedResult);
  });
});
