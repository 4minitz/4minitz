let spawn = require("child_process").spawn,
  killTree = require("tree-kill");

const transformCommand = (command, args) => {
  if (process.platform === "win32") {
    return {
      command: "cmd",
      args: ["/c", command].concat(args),
    };
  }

  return {
    command,
    args,
  };
};

function run(command, args, out) {
  let cmd = transformCommand(command, args),
    task = spawn(cmd.command, cmd.args),
    state = "running",
    pipe = (data) => {
      if (out) {
        const str = data.toString();
        out(str);
      }
    };

  task.stdout.on("data", pipe);
  task.stderr.on("data", pipe);

  task.on("close", () => {
    state = "closed";
  });

  return {
    name: command,
    kill(signal, callback) {
      if (state === "closed") {
        return;
      }

      signal = signal || "SIGINT";
      console.log(`Killing process ${task.pid}`);
      killTree(task.pid, signal, callback);
    },
  };
}

module.exports = {
  run,
};
