const ldap = require("ldapjs");
_ = require("underscore");

const users = [
  {
    dn: "cn=ldapUser1,dc=example,dc=com",
    password: "ldapPwd1",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "ldapUser1",
      mail: "ldapUser1@example.com",
    },
  },
  {
    dn: "cn=ldapUser2,dc=example,dc=com",
    password: "ldapPwd2",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "ldapUser2",
      mail: "ldapUser2@example.com",
    },
  },
  {
    dn: "cn=anotherLdapUser1,ou=germany,ou=europe,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "anotherLdapUser1",
      mail: "anotherLdapUser1@example.com",
    },
  },
  {
    dn: "cn=anotherLdapUser2,ou=japan,ou=asia,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      o: "example",
      cn: "anotherLdapUser2",
      mail: "anotherLdapUser2@example.com",
    },
  },
  {
    dn: "cn=inactiveUser1,dc=example,dc=com",
    password: "ldapPwd",
    attributes: {
      objectclass: ["organization", "top"],
      userAccountControl: 514,
      o: "example",
      cn: "inactiveUser1",
      mail: "inactiveUser1@example.com",
    },
  },
];

const server = ldap.createServer();

function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals("cn=ldapUser1,dc=example,dc=com"))
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}

server.search("dc=example,dc=com", authorize, (req, res, next) => {
  const matches = _.filter(users, (user) =>
    req.filter.matches(user.attributes),
  );
  _.each(matches, (match) => res.send(match));

  res.end();
  return next();
});

server.bind("dc=example,dc=com", (req, res, next) => {
  let dn = req.dn.toString(),
    normalizedDn = dn.replace(/ /g, ""),
    password = req.credentials;

  console.log(dn, normalizedDn, password);

  const matchingUsers = _.filter(users, (user) => normalizedDn == user.dn);

  console.log(matchingUsers);

  if (matchingUsers.length > 1) {
    return next(new ldap.UnwillingToPerformError());
  }

  if (matchingUsers.length == 0) {
    return next(new ldap.NoSuchObjectError(dn));
  }

  const user = matchingUsers[0];

  if (user.password != password) {
    return next(new ldap.InvalidCredentialsError());
  }

  res.end();
  return next();
});

server.listen(1389, () => {
  console.log(`ldapjs listening at ${server.url}`);
});
