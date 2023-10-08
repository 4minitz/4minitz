import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import asyncStubs from "../../../support/lib/asyncStubs";

const MongoClient = {
  connect: sinon.stub().resolves(),
};

const generate = sinon.stub().returns("123abc");

const bulk = {
  find: sinon.stub(),
  execute: sinon.stub(),
};

const client = {
  db() {
    return {
      collection: sinon.stub().returns({
        initializeUnorderedBulkOp: sinon.stub().returns(bulk),
      }),
    };
  },
  close: sinon.stub(),
};

const upsert = {
  upsert: sinon.stub(),
};

const updateOne = {
  updateOne: sinon.stub(),
};

const mongoUrl = "mongodb://host:port/db";
const users = [
  {
    cn: "username",
    mail: "user@example.com",
    password: "p@ssw0rd",
  },
];

const saveUsers = proxyquire("../../../../imports/ldap/saveUsers", {
  mongodb: { MongoClient, "@noCallThru": true },
  randomstring: { generate, "@noCallThru": true },
});

describe("saveUsers", () => {
  let settings;

  beforeEach(() => {
    MongoClient.connect = asyncStubs.doNothing();
    bulk.find.reset();
    bulk.execute.reset();
    client.close.reset();
    upsert.upsert.reset();
    updateOne.updateOne.reset();

    settings = {
      propertyMap: {},
      whiteListedFields: [],
      inactiveUsers: {
        strategy: "none",
      },
    };
  });

  it("inserts users into database", (done) => {
    MongoClient.connect = sinon.stub().resolves(client);
    upsert.upsert.returns(updateOne);
    bulk.find.returns(upsert);
    bulk.execute.returns("bulk done");

    saveUsers(settings, mongoUrl, users)
      .then((result) => {
        try {
          expect(result).to.deep.equal("bulk done");
          expect(bulk.find.calledOnce).to.be.true;
          expect(bulk.execute.calledOnce).to.be.true;

          done();
        } catch (error) {
          done(error);
        }
      })
      .catch((error) => {
        done(new Error(error));
      });
  });

  it("handles database connection problems", (done) => {
    MongoClient.connect = sinon.stub().rejects("Connection error"); //asyncStubs.returnsError(1, 'Connection error');

    saveUsers(settings, mongoUrl, users)
      .then((result) => {
        done(new Error(`Unexpected result: ${result}`));
      })
      .catch((error) => {
        try {
          expect(error.toString()).to.equal("Connection error");
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
