/*
 * This helper script generates a number of test users and stores them in the
 * DB. The test users will have no eMail address and will all have the same
 * password: PwdPwd1
 *
 * If MongoDB is listening on port 3101 then this call will create 5000 unique
 * users: node createTestUsers.js -m mongodb://localhost:3101/meteor -n 5000
 */

let mongo = require("mongodb").MongoClient;
const { faker } = require("@faker-js/faker");
let random = require("randomstring");

class UserFactory {
  static getUser() {
    UserFactory.counter += 1;
    const username = "user_" + UserFactory.postfix + "_" + UserFactory.counter;
    return {
      _id: random.generate({
        length: 17,
        charset: "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz",
      }),
      username: username,
      createdAt: new Date(),
      isInactive: false,
      services: {
        password: {
          // PwdPwd1
          bcrypt:
            "$2a$10$mtPbwEoJmaAO01fxI/WnZepoUz4D.U6f/yYl6KG1oojxNI7JZmn.S",
        },
      },
      profile: { name: faker.person.fullName() },
      emails: [{ address: username + "@4minitz.com", verified: false }],
    };
  }

  static saveUsers(db, numberOfUsers) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < numberOfUsers; i++) {
        let user = UserFactory.getUser();
        db.collection("users").insert(user);
        console.log(i + "\t" + user.username + "\t" + user.profile.name);
      }
      resolve(db);
    });
  }
}
UserFactory.counter = 0;
UserFactory.postfix = random.generate({
  length: 3,
  charset: "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz",
});

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

let optionParser = require("node-getopt").create([
  ["n", "number=[ARG]", "Number of users to be created"],
  ["m", "mongourl=[ARG]", "Mongo DB url"],
  ["h", "help", "Display this help"],
]);
let arg = optionParser.bindHelp().parseSystem();
let mongoUrl = arg.options.mongourl || process.env.MONGO_URL;
let numberOfUsers = arg.options.number;
if (!numberOfUsers) {
  optionParser.showHelp();
  console.error("No --numberparameter set");
  process.exit(1);
}
if (!mongoUrl) {
  optionParser.showHelp();
  console.error("No --mongourl parameter or MONGO_URL in env");
  process.exit(1);
}

_connectMongo(mongoUrl)
  .then((db) => UserFactory.saveUsers(db, numberOfUsers))
  .then((db) => db.close())
  .catch((error) => {
    console.log("Error: " + error);
  });
