let task = require('./lib/task');


if (process.platform === 'win32') {
    console.log('Windows is currently not supported. Please use');
    console.log('    npm run test:end2end:ldap');
    console.log('    npm run test:end2end:meteor');
    console.log('instead.');
    process.exit(0);
}

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
    tasks.forEach((task) => {
        task.kill();
    });

    process.exit();
});
