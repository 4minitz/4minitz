let spawn = require('child_process').spawn;


function run (command, args, out) {
    let task = spawn(command, args),
        state = 'running',
        pipe = (data) => {
            if (out) {
                let str = data.toString();
                out(str);
            }
        };

    task.stdout.on('data', pipe);
    task.stderr.on('data', pipe);

    task.on('close', () => {
        state = 'closed';
    });

    return {
        kill(signal) {
            if (state === 'closed') {
                return;
            }

            signal = signal || 'SIGINT';
            task.kill(signal);
        }
    };
}

module.exports = {
    run
};