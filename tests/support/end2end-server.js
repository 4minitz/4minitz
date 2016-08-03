let task = require('./lib/task'),
    _ = require('underscore');

function logTask(taskname) {
    return function (data) {
        process.stdout.write(taskname + ': ' + data);
    }
}

const tasks = [
    task.run('npm', ['run', 'test:end2end:ldap'], logTask('ldap')),
    task.run('npm', ['run', 'test:end2end:meteor'], logTask('meteor'))
];


if (process.platform === 'win32') {
    var readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.on('SIGINT', function () {
        process.emit('SIGINT');
    });
}

process.on('SIGINT', function () {
    _.each(tasks, (task) => {
        task.kill();
    });

    process.exit();
});
