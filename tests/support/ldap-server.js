let ldap = require('ldapjs')
    _ = require('underscore');

let users = [{
    dn: 'cn=ldapUser1,dc=example,dc=com',
    password: 'ldapPwd1',
    attributes: {
        objectclass: ['organization', 'top'],
        o: 'example',
        cn: 'ldapUser1',
        mail: 'ldapUser1@example.com'
    }
}, {
    dn: 'cn=ldapUser2,dc=example,dc=com',
    password: 'ldapPwd2',
    attributes: {
        objectclass: ['organization', 'top'],
        o: 'example',
        cn: 'ldapUser2',
        mail: 'ldapUser2@example.com'
    }
}];

let server = ldap.createServer();

server.search('dc=example,dc=com', function(req, res, next) {
    let matches = _.filter(users, user => req.filter.matches(user.attributes));
    _.each(matches, match => res.send(match));

    res.end();
    return next();
});

server.bind('dc=example,dc=com', function (req, res, next) {
    let dn = req.dn.toString(),
        normalizedDn = dn.replace(/ /g, ''),
        password = req.credentials;

    console.log(dn, normalizedDn, password);

    let matchingUsers = _.filter(users, user => normalizedDn == user.dn);

    console.log(matchingUsers);

    if (matchingUsers.length > 1) {
        return next(new ldap.UnwillingToPerformError());
    }

    if (matchingUsers.length == 0) {
        return next(new ldap.NoSuchObjectError(db));
    }

    let user = matchingUsers[0];

    if (user.password != password) {
        return next(new ldap.InvalidCredentialsError());
    }

    res.end();
    return next();
});

server.listen(1389, function() {
    console.log('ldapjs listening at ' + server.url);
});
