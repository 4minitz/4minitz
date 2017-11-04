#!/usr/bin/env bash

commitshort=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")

echo "Usage: ./BUILD_DEPLOY.sh"

echo "Building for commit ${commitshort} into .deploy/ directory"
#### Clean u
rm -rf .deploy/4minitz_bin/bundle/

#### Patch package.json with current git branch & version
(cd ./private && ./releasePrep.sh)

#### Build 4Minitz with meteor
mkdir .deploy/4minitz_bin
meteor npm install
meteor build .deploy/4minitz_bin --directory

# Our package.json will not be available - unless we copy it over to the image
# We'll need it for proper version info in the "About" dialog
cp package.json .deploy/4minitz_bin/bundle/programs/server/package4min.json
(cd .deploy/4minitz_bin/bundle/programs/server && meteor npm install --production)

#### Prepare settings.json
settingsfile=.deploy/4minitz_bin/settings.json
if [ -f "${settingsfile}" ]
then
    echo "settings.json found: ${settingsfile}"
    echo "We'll keep it!"
else
    cp ./settings_sample.json $settingsfile
    echo "Patching $settingsfile"
    sed -i '' 's/"ROOT_URL": "[^\"]*"/"ROOT_URL": "http:\/\/localhost:3100"/' $settingsfile
    sed -i '' 's/"topLeftLogoHTML": "[^\"]*"/"topLeftLogoHTML": "4Minitz"/' $settingsfile
    sed -i '' 's/"mongodumpTargetDirectory": "[^\"]*"/"mongodumpTargetDirectory": "\.\.\/\.\.\/\.\.\/4minitz_storage\/mongodump"/' $settingsfile
    sed -i '' 's/"storagePath": "[^\"]*"/"storagePath": "\.\.\/\.\.\/\.\.\/4minitz_storage\/attachments"/' $settingsfile
    sed -i '' 's/"targetDocPath": "[^\"]*"/"targetDocPath": "\.\.\/\.\.\/\.\.\/4minitz_storage\/protocols"/' $settingsfile
fi


#### run.sh & settings.json
runfile=.deploy/4minitz_bin/run.sh
if [ -f "${runfile}" ]
then
    echo "run.sh found: ${runfile}"
    echo "We'll keep it!"
else
    cp ./.deploy/run_sample.sh ${runfile}
fi

echo "Done."
