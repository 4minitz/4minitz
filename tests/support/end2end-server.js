const task = require("./lib/task");

function logTask(taskname) {
  return (data) => {
    process.stdout.write(`${taskname}: ${data}`);
  };
}

const tasks = [
  task.run("npm", ["run", "test:end2end:ldap"], logTask("ldap")),
  task.run("npm", ["run", "test:end2end:meteor"], logTask("meteor")),
];

function shutdown() {
  console.log("Kill all running tasks");

  const done = [].fill(false, 0, tasks.length);
  tasks.forEach((task, index) => {
    task.kill("SIGINT", (error) => {
      if (error) {
        console.warn("ERROR: ", error);
      }

      done[index] = true;
      if (!done.includes(false)) {
        console.log("All tasks killed, exiting.");
        process.exit(0);
      }
    });
  });
}

if (process.platform === "win32") {
  var readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.on("SIGINT", shutdown);
}

process.on("uncaughtException", shutdown);
process.on("SIGINT", shutdown);
