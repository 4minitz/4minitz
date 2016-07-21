let child_process = require('child_process');

function capture(err, stdout, stderr) {
    console.error(err);
    console.log(stdout);
    console.warn(stderr);
}

let meteor = child_process.spawn('npm', ['run', 'test:end2end:server']);

let output = '';

meteor.stdout.on('data', (data) => {
    let buffer = data.toString();
    output += buffer;
    console.log(buffer);

    if (output.indexOf('=> App running at: http://localhost') > -1) {
        meteor.kill();
        child_process.exec("kill `ps ax | grep '[m]eteor' | awk '{print $1}'`");
        process.exit(0);
    }
});

meteor.stderr.on('data', (data) => {
    let buffer = data.toString();
    console.log(buffer);
});

