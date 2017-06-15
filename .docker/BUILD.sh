#!/usr/bin/env bash

dockerproject=4minitz/4minitz
commitshort=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
baseimagetag=$dockerproject:gitcommit-$commitshort

echo "Usage: ./BUILD.sh [--imagename USER/IMAGE] [LIST OF TAGS]"
echo "       e.g.: ./BUILD.sh master stable latest 0.9.1"
echo "       e.g.: ./BUILD.sh develop unstable"
echo "       e.g.: ./BUILD.sh --imagename johndoe/4minitz master stable latest 0.9.1"
echo "       The default docker project is '$dockerproject'"
echo ""

#### Commandline parsing
if [ "$1" == "--imagename" ]; then
  dockerproject=$2
  shift 2
fi
echo "Docker Project   : '$dockerproject'"
echo "Target Base Image: '$baseimagetag'"
echo ""


#### Prepare settings.json
settingsfile=./4minitz_settings.json
echo "Patching $settingsfile"
cp ../settings_sample.json $settingsfile
sed -i '' 's/"ROOT_URL": "[^\"]*"/"ROOT_URL": "http:\/\/localhost:3100"/' $settingsfile
sed -i '' 's/"topLeftLogoHTML": "[^\"]*"/"topLeftLogoHTML": "4Minitz [Docker]"/' $settingsfile
sed -i '' 's/"mongodumpTargetDirectory": "[^\"]*"/"mongodumpTargetDirectory": "\/4minitz_storage\/mongodump"/' $settingsfile
sed -i '' 's/"storagePath": "[^\"]*"/"storagePath": "\/4minitz_storage\/attachments"/' $settingsfile


#### Build 4Minitz with meteor
cd ..                           # pwd => "/" of 4minitz project
mkdir .docker/4minitz_bin
meteor npm install
meteor build .docker/4minitz_bin --directory
# Our package.json will not be available - unless we copy it over to the image
cp package.json .docker/4minitz_bin/bundle/programs/server/package4min.json
cd .docker/4minitz_bin/bundle/programs/server || exit 1
meteor npm install --production

#### Build 4Minitz docker image
cd ../../../.. || exit 1                 # pwd => .docker
docker build --no-cache -t "$baseimagetag" .
echo "--------- CCPCL: The 'Convenience Copy&Paste Command List'"
echo "docker push $baseimagetag"
pushlist="docker push $baseimagetag"

# iterate over list of tags like: ./BUILD.sh 1 1.9 1.9.3
for var in "$@"
do
    imgtag=$dockerproject:$var
    docker tag "$baseimagetag" "$imgtag"
    pushcmd="docker push $imgtag"
    echo "$pushcmd"
    pushlist="$pushlist && $pushcmd"
done
echo "---------"
echo "$pushlist"

#### Clean up
rm -rf 4minitz_bin
