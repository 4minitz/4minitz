import { spawn } from "child_process";
import Future from "fibers/future";
import mongoUri from "mongo-uri";

function dumpParameters(uri, path) {
  const params = [];

  let host = uri.hosts[0];
  if (uri.ports[0]) {
    host += `:${uri.ports[0]}`;
  }

  params.push("-h");
  params.push(host);

  if (uri.username) {
    params.push("-u");
    params.push(uri.username);
    params.push("-p");
    params.push(uri.password);
  }

  params.push("-d");
  params.push(uri.database);

  params.push("-o");
  params.push(path);

  return params;
}

export const backupMongo = (mongoUrl, path) => {
  console.log("Backing up mongodb", mongoUrl, "to", path);

  const uri = mongoUri.parse(mongoUrl);
  const parameters = dumpParameters(uri, path);
  const command = "mongodump";
  const future = new Future();

  const dumpProcess = spawn(command, parameters);
  dumpProcess.on("error", console.log);

  dumpProcess.on("close", (code) => {
    console.log("mongodump ended with exit code", code);
    future.return();
  });

  return future.wait();
};
