#!/usr/bin/env bash

dockerimage=derwok/4minitz

echo "Usage: ./BUILD.sh [LIST OF TAGS] - e.g., ./BUILD.sh 1 1.9 1.9.3"

#### Prepare settings.json
settingsfile=./4minitz_settings.json
if [ -f "$settingsfile" ]
then
    echo "$settingsfile found on your local host directory."
else
    echo "Patching $settingsfile"
    cp ../settings_sample.json $settingsfile
    sed -i '' 's/"ROOT_URL": "[^\"]*"/"ROOT_URL": "http:\/\/localhost:3100"/' $settingsfile
    sed -i '' 's/"topLeftLogoHTML": "[^\"]*"/"topLeftLogoHTML": "4Minitz [Docker]"/' $settingsfile
    sed -i '' 's/"mongodumpTargetDirectory": "[^\"]*"/"mongodumpTargetDirectory": "\/4minitz_storage\/mongodump"/' $settingsfile
    sed -i '' 's/"storagePath": "[^\"]*"/"storagePath": "\/4minitz_storage\/attachments"/' $settingsfile
fi


#### Build 4Minitz with meteor
cd ..                           # pwd => "/" of 4minitz project
mkdir .docker/4minitz_bin
meteor npm install
meteor build .docker/4minitz_bin --directory
# Our package.json will not be available - unless we copy it over to the image
cp package.json .docker/4minitz_bin/bundle/programs/server/package4min.json
cd .docker/4minitz_bin/bundle/programs/server
meteor npm install --production

#### Build 4Minitz docker image
cd ../../../..                  # pwd => .docker
docker build --no-cache -t $dockerimage .
echo "--------- CCPCL: The 'Convenience Copy&Paste Command List'"
echo "docker push $dockerimage"

# iterate over list of tags like: ./BUILD.sh 1 1.9 1.9.3
for var in "$@"
do
    imgtag=$dockerimage:$var
    docker tag $dockerimage $imgtag
    echo "docker push $imgtag"
done
echo "---------"

#### Clean up
rm -rf 4minitz_bin
