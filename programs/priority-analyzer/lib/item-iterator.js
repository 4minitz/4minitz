const mongo = require("mongodb").MongoClient;

export class ItemIterator {
  constructor(mongourl, analyzer) {
    this.db = null;
    this.mongoUrl = mongourl;
    this.analyzer = analyzer;
  }

  async execute() {
    await this.connect();
    const cursor = this.db.collection("minutes").find({}, { topics: 1 });
    await this.iterateOverCursor(cursor);
    await this.close();
  }

  async iterateOverCursor(cursor) {
    return new Promise((resolve, reject) => {
      cursor.each((err, minutes) => {
        if (err) {
          reject(err);
        } else {
          if (minutes !== null) {
            minutes.topics.forEach((topic) => {
              topic.infoItems.forEach((item) => {
                this.analyzer.analyseActionItem(item);
              });
            });
          } else {
            resolve();
          }
        }
      });
    });
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
}
