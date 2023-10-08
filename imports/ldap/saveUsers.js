let mongo = require("mongodb").MongoClient,
  mongoUriParser = require("mongo-uri"),
  transformUser = require("./transformUser"),
  _ = require("underscore");
import { Random } from "../../tests/performance/fixtures/lib/random";

const _transformUsers = (settings, users) =>
  _.map(users, (user) => transformUser(settings, user));

const _connectMongo = (mongoUrl) => mongo.connect(mongoUrl);

RegExp.escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

const _insertUsers = (client, mongoUri, users) => {
  // unique id from the random package also used by minimongo
  // character list:
  // https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L88
  // string length:
  // https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L197
  const randomStringConfig = {
    length: 17,
    charset: "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz",
  };

  return new Promise((resolve, reject) => {
    try {
      const mongoConnection = mongoUriParser.parse(mongoUri);
      const bulk = client
        .db(mongoConnection.database)
        .collection("users")
        .initializeUnorderedBulkOp();
      _.each(users, (user) => {
        if (user?.username && user.emails[0] && user.emails[0].address) {
          user.isLDAPuser = true;
          const usrRegExp = new RegExp(
            `^${RegExp.escape(user.username)}$`,
            "i",
          );
          bulk
            .find({ username: usrRegExp })
            .upsert()
            .updateOne({
              $setOnInsert: {
                _id: Random.generateId(),
                // by setting this only on insert we won't log out everyone
                // everytime we sync the users
                services: {
                  password: { bcrypt: "" },
                  resume: { loginTokens: [] },
                },
              },
              $set: user,
            });
        } else {
          const stringifiedUser = JSON.stringify(user, null, 2);
          console.log(
            `SKIPPED INVALID USER (no username or no valid emails[0].address): ${stringifiedUser}`,
          );
        }
      });
      const bulkResult = bulk.execute();

      resolve({ client, bulkResult });
    } catch (error) {
      reject(error);
    }
  });
};

const _closeMongo = (data) => {
  let force = false,
    client = data.client,
    result = data.bulkResult;

  return new Promise((resolve) => {
    client.close(force);
    resolve(result);
  });
};

const saveUsers = (settings, mongoUrl, users) => {
  const dbUsers = _transformUsers(settings, users);

  return new Promise((resolve, reject) => {
    _connectMongo(mongoUrl)
      .then((client) => {
        return _insertUsers(client, mongoUrl, dbUsers);
      })
      .then(_closeMongo)
      .then(resolve)
      .catch(reject);
  });
};

module.exports = saveUsers;
