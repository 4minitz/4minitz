const mongo = require("mongodb").MongoClient;

export const Collections = {
  MeetingSeries: "meetingSeries",
  Minutes: "minutes",
  Topcis: "topics",
  Users: "users",
};

export class MongoDb {
  constructor(mongoUrl) {
    this.mongoUrl = mongoUrl;
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      mongo.connect(this.mongoUrl, (error, db) => {
        if (error) {
          reject(error);
        } else {
          this.db = db;
          resolve();
        }
      });
    });
  }

  async findOne(collection, query, options = null) {
    if (options) {
      return this._asyncCollectionWrapper(
        "findOne",
        collection,
        query,
        options,
      );
    } else {
      return this._asyncCollectionWrapper("findOne", collection, query);
    }
  }

  async updateOne(collection, doc, options) {
    return this._asyncCollectionWrapper("updateOne", collection, doc, options);
  }

  async insertOne(collection, doc, options = null) {
    return this._asyncCollectionWrapper("insertOne", collection, doc, options);
  }

  async insertMany(collection, docs, options = null) {
    return this._asyncCollectionWrapper(
      "insertMany",
      collection,
      docs,
      options,
    );
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async _asyncCollectionWrapper(method, collection, ...args) {
    return new Promise((resolve, reject) => {
      this.db.collection(collection)[method](...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
