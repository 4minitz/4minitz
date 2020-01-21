let fs = require('fs');
let yaml = require('js-yaml');

const en_yaml = __dirname+'/../../both/i18n/en.i18n.yml';
let anyError = 0;

console.log('Test_I18N_Resources');
console.log('-------------------');
console.log('Test if all needed string resources used in code are present in YAML: '+en_yaml);

let dictKeysFromYaml = {};
let dictKeysFromCode = {};
let count = 0;

// Recursive find files with file extension
function collectFilesRecursive (dir, extension) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            let aDir = file;
            if (!aDir.endsWith('/node_modules')
                && !aDir.endsWith('/.deploy')
                && !aDir.endsWith('/.docker')
                && !aDir.endsWith('/.meteor')
                && !aDir.endsWith('/migrations')
                && !aDir.endsWith('/packages')
                && !aDir.endsWith('/doc')
                && !aDir.endsWith('/tests'))
            {
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
function iterate(obj, stack) {
    for (let property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == 'object') {
                if (!stack) {
                    iterate(obj[property], property);
                } else {
                    iterate(obj[property], stack + '.' + property);
                }
            } else {
                dictKeysFromYaml[stack+'.'+property] = 1;
            }
        }
    }
}


// ---------------------------------------------------------------  YAML
// Read and parse YAML file to JS object
let yaml_doc = undefined;
try {
    yaml_doc = yaml.safeLoad(fs.readFileSync(en_yaml, 'utf8'));
} catch (e) {
    console.log(e);
    anyError = 10;
}
// Recursively walk the YAML JS object, build key pathes like: 'Admin.Users.State.column'
if (yaml_doc) {
    iterate(yaml_doc, '');  // ==> results in dictKeysFromYaml
} else {
    console.log('Error: could not parse YAML');
    anyError = 20;
}
console.log('#keys in YAML: '+Object.keys(dictKeysFromYaml).length);


// ---------------------------------------------------------------  Code
function checkCodeUsage(extension, keyPattern) {
    let files_js = collectFilesRecursive(__dirname+'/../..', extension);
    files_js.forEach(jsFile => {
        const content = fs.readFileSync(jsFile, 'utf8');
        const re = keyPattern;
        let m;
        do {
            m = re.exec(content);
            if (m) {
                if (dictKeysFromCode[m[1]]) {
                    dictKeysFromCode[m[1]] = dictKeysFromCode[m[1]] + '\n' + jsFile;
                } else {
                    dictKeysFromCode[m[1]] = jsFile;
                }
                count++;
            }
        } while (m);
    });
    console.log('#keys in '+extension+': '+count);

    // Check if needed keys from code exist in YAML
    for (const keyFromCode in dictKeysFromCode) {
        if (! dictKeysFromYaml[keyFromCode]) {
            console.log('I18N-ERROR: >'+keyFromCode+'< not found in YAML needed by:');
            console.log(dictKeysFromCode[keyFromCode]+'\n');
            anyError = 1;
        }
    }
}

// js: i18n.__('Admin.Users.State.inactive'); => Admin.Users.State.inactive
checkCodeUsage('.js', /i18n\.__\s*\(\s*["']([^"']+)/gm);

// html: {{__ 'Dialog.ConfirmDeleteTopic.allowed'}} => Dialog.ConfirmDeleteTopic.allowed
checkCodeUsage('.html', /{{__\s*["']([^"']+)/gm);

process.exitCode = anyError;
