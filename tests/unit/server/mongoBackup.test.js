import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const spawn = sinon.stub().returns({ on: sinon.spy() });

const Future = function () {
  this["return"] = sinon.spy();
  this.wait = sinon.spy();
};
Future["@noCallThru"] = true;

const { backupMongo } = proxyquire("../../../server/mongoBackup", {
  child_process: { spawn, "@noCallThru": true },
  "fibers/future": Future,
});

describe("mongoBackup", () => {
  describe("#backupMongo", () => {
    beforeEach(() => {
      spawn.resetHistory();
    });

    it("uses mongodump to create a backup", () => {
      backupMongo(
        "mongodb://user:password@localhost:1234/database",
        "outputdir",
      );

      const firstCall = spawn.args[0];
      const command = firstCall[0];
      const parameters = firstCall[1].join(";");

      expect(command).to.equal("mongodump");
      expect(parameters).to.equal(
        "-h;localhost:1234;-u;user;-p;password;-d;database;-o;outputdir",
      );
    });
  });
});
