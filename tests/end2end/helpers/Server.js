const DDPClient = require("meteor-sdk");
const Future = require("fibers/future");

const ddpclient = new DDPClient({
  host: "localhost",
  port: 3100,
  ssl: false,
  autoReconnect: true,
  autoReconnectTimer: 500,
  maintainCollections: true,
  ddpVersion: "1",
  useSockJs: true,
});

function connect() {
  const future = new Future();
  ddpclient.connect(function (error) {
    if (error) {
      future.throw(error);
    }

    future.return();
  });

  return future;
}

function close() {
  ddpclient.close();
}

function call() {
  const future = new Future();

  ddpclient.call(
    arguments[0],
    [].slice.call(arguments, 1),
    function (err, result) {
      if (err) {
        future.throw(err);
      }
      future.return(result);
    },
  );

  return future;
}

const server = {
  connect: function () {
    return connect().wait();
  },

  close: function () {
    close();
  },

  call: function () {
    return call.apply(this, arguments).wait();
  },
};

global.server = server;
module.exports = server;
