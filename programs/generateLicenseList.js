const crawler = require("npm-license-crawler"),
  http = require("http"),
  https = require("https"),
  fs = require("fs");

const meteorPackages = {
  meteor: {
    licenses: "MIT",
    licenseUrl: "https://raw.githubusercontent.com/meteor/meteor/devel/LICENSE",
  },
  "alanning:roles": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/alanning/meteor-roles/master/LICENSE",
  },
  "babrahams:accounts-ldap": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/JackAdams/meteor-accounts-ldap/master/LICENSE",
  },
  "felixble:server-templates": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/felixble/meteor-server-templates/master/LICENSE.md",
  },
  "fourseven:scss": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/fourseven/meteor-scss/master/LICENSE.txt",
  },
  "jagi:astronomy": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/jagi/meteor-astronomy/v2/LICENSE",
  },
  "kadira:blaze-layout": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/kadirahq/blaze-layout/master/LICENSE",
  },
  "ostrio:flow-router-extra": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/VeliovGroup/flow-router/master/LICENSE",
  },
  "meteorhacks:subs-manager": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/kadirahq/subs-manager/master/LICENSE",
  },
  "mouse0270:bootstrap-notify": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/mouse0270/bootstrap-notify/master/LICENSE",
  },
  // "msavin:mongol":                {licenses: "MIT",      licenseUrl: "https://raw.githubusercontent.com/MeteorToys/allthings/master/LICENSE.md"},
  "natestrauser:select2": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/nate-strauser/meteor-select2/master/LICENSE.txt",
  },
  "ostrio:files": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/VeliovGroup/Meteor-Files/master/LICENSE",
  },
  "perak:markdown": {
    licenses: "MIT",
    licenseUrl: "https://raw.githubusercontent.com/chjj/marked/master/LICENSE",
  },
  "percolate:migrations": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/percolatestudio/meteor-migrations/master/LICENSE",
  },
  "practicalmeteor:mocha": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/practicalmeteor/meteor-mocha/meteor/LICENSE",
  },
  "rcy:pick-a-color": {
    licenses: "MIT",
    licenseUrl: "https://github.com/lauren/pick-a-color/raw/master/LICENSE",
  },
  "sergeyt:typeahead": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/sergeyt/meteor-typeahead/master/LICENSE",
  },
  "useraccounts:bootstrap": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/meteor-useraccounts/bootstrap/master/LICENSE",
  },
  "universe:i18n": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/vazco/meteor-universe-i18n/master/LICENSE",
  },
  "universe:i18n-blaze": {
    licenses: "MIT",
    licenseUrl:
      "https://raw.githubusercontent.com/vazco/universe-i18n-blaze/master/LICENSE",
  },
};

function get(url, callback) {
  if (url.indexOf("https") === 0) {
    https.get(url, callback);
  } else {
    http.get(url, callback);
  }
}

function downloadToStream(project, url, licenseId, originalLicenseUrl) {
  if (!url) {
    return Promise.resolve({ project, stream: null, url });
  }

  // handle projects that declare a license but only with their SPDX id in package.json
  // and don't provide the license text in their repo
  // SPDX provides a repo with all licenses at https://github.com/spdx/license-list
  if (url.indexOf("raw") === -1) {
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
        resolve({ project, url });
      } else {
        resolve({ project, stream: response, url });
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
    .then(({ project, stream, url }) => {
      const underlineProject = Array(project.length).join("="),
        licenseSeparator = Array(80).join("=");

      outStream.write(`${project}\n${underlineProject}\n\n${url}\n\n`);
      if (stream) {
        console.log(`Writing license of ${project}`);

        stream.pipe(outStream, { end: false });
        stream.on("end", () => {
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

const licenseCount = {};
function getSortedKeys(obj) {
  const keys = [];
  for (const key in obj) keys.push(key);
  return keys.sort((a, b) => obj[b] - obj[a]);
}

crawler.dumpLicenses({ start: ["."] }, (error, res) => {
  if (error) {
    console.error("Error:", error);
    return;
  }

  const output = fs.createWriteStream("LicensesOfDependencies.txt");
  const streams = Object.keys(res).map((project) =>
    downloadToStream(project, res[project].licenseUrl, res[project].licenses),
  );

  streamCollector(streams, 0, output);

  // Generate & print license counts
  console.log("********************");
  Object.assign(res, meteorPackages);
  Object.keys(res).forEach((project) => {
    licenseCount[res[project].licenses] =
      (licenseCount[res[project].licenses] || 0) + 1;
  });
  getSortedKeys(licenseCount).forEach((license) =>
    console.log(`${license}   ${licenseCount[license]}`),
  );
  console.log("********************");
});
