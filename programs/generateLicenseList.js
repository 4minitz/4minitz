const crawler = require('npm-license-crawler'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    Readable = require('stream').Readable,
    options = {
        start: ['.']
    };

function get(url, callback) {
    if (url.indexOf('https') === 0) {
        https.get(url, callback);
    } else {
        http.get(url, callback);
    }
}

function downloadToStream(project, url) {
    if (!url || url.indexOf('raw') === -1) {
        return Promise.resolve({project, stream: null, url});
    }

    return new Promise((resolve, reject) => {
        const callback = (response) => {
            // handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400) {
                const location = response.headers.location;
                get(location, callback);
            } else if (response.statusCode === 404) {
                console.log(`404: ${url} not found`);
                resolve({project, stream: null, url});
            } else {
                resolve({project, stream: response, url});
            }
        };

        get(url, callback);
    });
}

function* streamYielder(streams) {
    yield* streams;
}

function synchronousStreamCollector(generator, outStream) {
    let next = generator.next();
    if (!next.done && next.value) {
        next.value
            .then(({project, stream, url}) => {
                const underlineProject = Array(project.length).join('='),
                    licenseSeparator = Array(80).join('=');

                outStream.write(`${project}\n${underlineProject}\n\n${url}\n\n`);
                if (stream !== null) {
                    console.log(`Writing license of ${project}`);

                    stream.pipe(outStream, {end: false});
                    stream.on('end', () => {
                        outStream.write(`\n\n${licenseSeparator}\n\n`);
                        synchronousStreamCollector(generator, outStream);
                    });
                } else {
                    console.log(`NO LICENSE TEXT FOUND FOR ${project}`);
                    outStream.write(`\n\n${licenseSeparator}\n\n`);
                    synchronousStreamCollector(generator, outStream);
                }
            })
            .catch(console.error);
    }
}

crawler.dumpLicenses(options, (error, res) => {
    if (error) {
        console.error("Error:", error);
        return;
    }

    let output = fs.createWriteStream("LicensesOfDependencies.txt");
    let streams = Object.keys(res)
        .map(project => downloadToStream(project, res[project].licenseUrl));
    
    synchronousStreamCollector(streamYielder(streams), output);
});