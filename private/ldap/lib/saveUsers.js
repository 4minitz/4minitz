let mongo = require('mongodb').MongoClient,
    random = require('randomstring'),
    _ = require('underscore');

let _createUser = function (ldapSettings, userData) {
    let searchDn = ldapSettings.searchDn || 'cn';

    // userData.mail may be a string with one mail address or an array.
    // Nevertheless we are only interested in the first mail address here - if there should be more...
    let tmpEMail = userData.mail;
    if( Object.prototype.toString.call( userData.mail ) === '[object Array]' ) {
        tmpEMail = userData.mail[0];
    }
    let tmpEMailArray = [{
        address: tmpEMail,
        verified: true,
        fromLDAP: true
    }];
    let usr= {
        createdAt: new Date(),
        emails: tmpEMailArray,
        username: userData[searchDn],
        profile: _.pick(userData, _.without(ldapSettings.whiteListedFields, 'mail'))
    };
    // copy over the LDAP user's long name from "cn" field to the meteor accounts long name field
    if (usr.profile.cn) {
        usr.profile.name = usr.profile.cn;
        delete usr.profile.cn;
    }
    return usr;
};

let _transformUsers = function (settings, users) {
    return _.map(users, user => _createUser(settings, user));
};

let _connectMongo = function (mongoUrl) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongoUrl, (error, db) => {
            if (error) {
                reject(error);
            }

            resolve(db);
        });
    });
};

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

let _insertUsers = function (db, users) {
    // unique id from the random package also used by minimongo
    // character list: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L88
    // string length: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L197
    const randomStringConfig = {
        length: 17,
        charset: '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz'
    };

    return new Promise((resolve, reject) => {
        try {
            let bulk = db.collection('users').initializeUnorderedBulkOp();
            _.each(users, user => {
                if (user && user.username && user.emails[0] && user.emails[0].address) {
                    let usrRegExp = new RegExp("^"+RegExp.escape(user.username)+"$", "i");
                    bulk.find({username: usrRegExp}).upsert().updateOne({
                        $setOnInsert: {
                            _id: random.generate(randomStringConfig),
                            // by setting this only on insert we won't log out everyone
                            // everytime we sync the users
                            services: {
                                password: {bcrypt: ""},
                                resume: {"loginTokens": []}
                            }
                        },
                        $set: user
                    });
                } else {
                    console.log("SKIPPED INVALID USER (no username or no valid emails[0].address): "+JSON.stringify(user,null,2));
                }
            });
            let bulkResult = bulk.execute();

            resolve({db, bulkResult});
        } catch (error) {
            reject(error);
        }
    });
};

let _closeMongo = function (data) {
    let force = true,
        db = data.db,
        result = data.bulkResult;

    return new Promise((resolve) => {
        db.close(force);
        resolve(result);
    });
};


let saveUsers = function (settings, mongoUrl, users) {
    let dbUsers = _transformUsers(settings, users);

    return new Promise((resolve, reject) => {
        _connectMongo(mongoUrl)
            .then(db => {
                return _insertUsers(db, dbUsers);
            })
            .then(_closeMongo)
            .then(resolve)
            .catch(reject);
    });
};

module.exports = {
    _createUser,
    _transformUsers,
    _connectMongo,
    _insertUsers,
    _closeMongo,

    saveUsers
};