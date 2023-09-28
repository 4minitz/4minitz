/*
 * This script will check i18n resources keys
 * 1. read all available keys from YAML
 * 2. read all needed keys from HTML & JS files
 * 3. Generate warning on unused keys
 *    Generate errors on needed but unavailable keys
 *
 * Hint: You may ignore errors by keys that are calcultated at runtime
 * by adding these keys to the IGNOREKEYS object
 *
 */

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const IGNOREKEYS = {
  "UserRoles.role": true, // calculated at runtime: i18n.__('UserRoles.roleName'+roleValue);
};
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

let fs = require("fs");
let yaml = require("js-yaml");

const en_yaml = __dirname + "/../../both/i18n/en.i18n.yml";
let anyErrorExitCodeToShell = 0;
let globalErrorCount = 0;
let globalWarningCount = 0;

console.log("Test_I18N_Resources");
console.log("-------------------");
console.log(
  "Test if all needed string resources used in code are present in YAML: " +
    en_yaml,
);

let dictKeysFromYaml = {};
let dictKeysFromCode = {};
let count = 0;

// Recursive find files with file extension
function collectFilesRecursive(dir, extension) {
  let results = [];
  let list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = dir + "/" + file;
    let stat = fs.statSync(file);
    if (stat?.isDirectory()) {
      /* Recurse into a subdirectory */
      let aDir = file;
      if (
        !aDir.endsWith("/node_modules") &&
        !aDir.endsWith("/.deploy") &&
        !aDir.endsWith("/.docker") &&
        !aDir.endsWith("/.meteor") &&
        !aDir.endsWith("/migrations") &&
        !aDir.endsWith("/packages") &&
        !aDir.endsWith("/doc") &&
        !aDir.endsWith("/tests")
      ) {
        results = results.concat(collectFilesRecursive(aDir, extension));
      }
    } else {
      /* Is a file */
      if (file.endsWith(extension)) {
        results.push(file);
      }
    }
  });
  return results;
}

// Recursively iterate a JS object build full pathes of keys
function buildFullPathes(obj, stack, separator = ".") {
  for (let property in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, property)) {
      if (typeof obj[property] == "object") {
        if (!stack) {
          buildFullPathes(obj[property], property);
        } else {
          buildFullPathes(obj[property], stack + separator + property);
        }
      } else {
        dictKeysFromYaml[stack + separator + property] = 0; // Remember leaf!
      }
    }
  }
}

function checkCodeUsage(extension, keyPattern) {
  dictKeysFromCode = {};
  let localErrorCount = 0;
  let files_js = collectFilesRecursive(__dirname + "/../..", extension);

  // Find all i18n __ keys used in this file, according to regexp key pattern provided
  files_js.forEach((jsFile) => {
    const content = fs.readFileSync(jsFile, "utf8");
    const re = keyPattern;
    let m;
    do {
      m = re.exec(content);
      if (m && !IGNOREKEYS[m[1]]) {
        // we have a match that is NOT in IGNOREKEYS
        if (dictKeysFromCode[m[1]]) {
          dictKeysFromCode[m[1]] = dictKeysFromCode[m[1]] + "\n" + jsFile;
        } else {
          dictKeysFromCode[m[1]] = jsFile;
        }
        count++;
      }
    } while (m);
  });
  console.log("#keys in " + extension + ": " + count);

  // Check if needed keys from code exist in YAML
  for (const keyFromCode in dictKeysFromCode) {
    if (dictKeysFromYaml[keyFromCode] === undefined) {
      console.log(
        "I18N-ERROR: >" + keyFromCode + "< not found in YAML needed by:",
      );
      console.log(dictKeysFromCode[keyFromCode] + "\n");
      anyErrorExitCodeToShell = 1;
      localErrorCount++;
      globalErrorCount++;
    } else {
      dictKeysFromYaml[keyFromCode]++; // increase usage of this key
    }
  }
  console.log("#I18N Errors for " + extension + ": " + localErrorCount);
  console.log("---------------------------------------------");
  console.log("");
}

// ---------------------------------------------------------------  YAML
// Read and parse YAML file to JS object
let yaml_doc = undefined;
try {
  yaml_doc = yaml.safeLoad(fs.readFileSync(en_yaml, "utf8"));
} catch (e) {
  console.log(e);
  anyErrorExitCodeToShell = 10;
}
// Recursively walk the YAML JS object, build key pathes like: 'Admin.Users.State.column'
if (yaml_doc) {
  buildFullPathes(yaml_doc, ""); // ==> results in dictKeysFromYaml
} else {
  console.log("Error: could not parse YAML");
  anyErrorExitCodeToShell = 20;
}
console.log("#keys in YAML: " + Object.keys(dictKeysFromYaml).length);
console.log("---------------------------------------------");
console.log("");

// ---------------------------------------------------------------  Code Errors
// js: i18n.__('Admin.Users.State.inactive'); => Admin.Users.State.inactive
checkCodeUsage(".js", /i18n\.__\s*\(\s*["']([^"']+)/gm);

// html: {{__ 'Dialog.ConfirmDeleteTopic.allowed'}} => Dialog.ConfirmDeleteTopic.allowed
checkCodeUsage(".html", /{{__\s*["']([^"']+)/gm);

// ---------------------------------------------------------------  YAML Warnings
for (const keyFromYaml in dictKeysFromYaml) {
  if (!keyFromYaml.startsWith("._") && dictKeysFromYaml[keyFromYaml] === 0) {
    console.log(
      "I18N-Warning: >" + keyFromYaml + "< from YAML never used in code.",
    );
    globalWarningCount++;
  }
}

console.log("");
console.log("#I18N Errors Total  : " + globalErrorCount);
console.log("#I18N Warnings Total: " + globalWarningCount);
console.log("");

process.exitCode = anyErrorExitCodeToShell;
