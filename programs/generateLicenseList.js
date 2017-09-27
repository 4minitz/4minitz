const crawler = require('npm-license-crawler'),
    http = require('http'),
    https = require('https'),
    fs = require('fs');

function get(url, callback) {
    if (url.indexOf('https') === 0) {
        https.get(url, callback);
    } else {
        http.get(url, callback);
    }
}

function downloadToStream(project, url, licenseId, originalLicenseUrl) {
    if (!url) {
        return Promise.resolve({project, stream: null, url});
    }

    // handle projects that declare a license but only with their SPDX id in package.json
    // and don't provide the license text in their repo
    // SPDX provides a repo with all licenses at https://github.com/spdx/license-list
    if (url.indexOf('raw') === -1) {
        const SPDXUrl = `https://github.com/spdx/license-list/raw/master/${licenseId}.txt`;
        return downloadToStream(project, SPDXUrl, licenseId, url);

    }

    return new Promise((resolve, reject) => {
        const callback = (response) => {
            // we want the original license to be printed. if the license
            // was retrieved from the SDPX repo we get the original url
            // as the last parameter
            url = originalLicenseUrl || url;
            
            // handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400) {
                const location = response.headers.location;
                get(location, callback);
            // handle client and server errors
            } else if (response.statusCode >= 400) {
                console.log(`${response.statusCode}: ${url} not found`);
                resolve({project, url});
            } else {
                resolve({project, stream: response, url});
            }
        };

        get(url, callback);
    });
}

function streamCollector(streams, index, outStream) {
    if (index >= streams.length) {
        return;
    }

    streams[index]
        .then(({project, stream, url}) => {
            const underlineProject = Array(project.length).join('='),
                licenseSeparator = Array(80).join('=');

            outStream.write(`${project}\n${underlineProject}\n\n${url}\n\n`);
            if (stream) {
                console.log(`Writing license of ${project}`);

                stream.pipe(outStream, {end: false});
                stream.on('end', () => {
                    outStream.write(`\n\n${licenseSeparator}\n\n`);
                    streamCollector(streams, index + 1, outStream);
                });
            } else {
                console.log(`NO LICENSE TEXT FOUND FOR ${project}`);
                outStream.write(`\n\n${licenseSeparator}\n\n`);
                streamCollector(streams, index + 1, outStream);
            }
        })
        .catch(console.error);
}

crawler.dumpLicenses({start: ['.']}, (error, res) => {
    if (error) {
        console.error("Error:", error);
        return;
    }

    let output = fs.createWriteStream("LicensesOfDependencies.txt");
    let streams = Object.keys(res)
        .map(project => downloadToStream(project, res[project].licenseUrl, res[project].licenses));
    
    streamCollector(streams, 0, output);
});