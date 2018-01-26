#!/usr/bin/env bash

dockerproject=4minitz/4minitz
commitshort=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
baseimagetag=$dockerproject:gitcommit-$commitshort

echo "Usage: ./BUILD_DOCKER.sh [--imagename USER/IMAGE] [LIST OF TAGS]"
echo "       e.g.: ./BUILD.sh master stable latest 0.9.1"
echo "       e.g.: ./BUILD.sh develop unstable"
echo "       e.g.: ./BUILD.sh --imagename johndoe/4minitz master stable latest 0.9.1"
echo "       The default docker project is '$dockerproject'"
echo ""

#### Check if docker daemon is running
rep=$(curl -s --unix-socket /var/run/docker.sock http://ping > /dev/null)
dockerstatus=$?
if [ "$dockerstatus" == "7" ]; then
    echo ' '
    echo '*** ERROR'
    echo '  Could not connect to docker.'
    echo '  Is the "docker -d" daemon running?'
    echo '  Will EXIT now!'
    exit 1
fi


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
cp ../settings_sample.json $settingsfile
echo "Patching $settingsfile"
sed -i '' 's/"ROOT_URL": "[^\"]*"/"ROOT_URL": "http:\/\/localhost:3100"/' $settingsfile
sed -i '' 's/"topLeftLogoHTML": "[^\"]*"/"topLeftLogoHTML": "4Minitz [Docker]"/' $settingsfile
sed -i '' 's/"mongodumpTargetDirectory": "[^\"]*"/"mongodumpTargetDirectory": "\/4minitz_storage\/mongodump"/' $settingsfile
sed -i '' 's/"storagePath": "[^\"]*"/"storagePath": "\/4minitz_storage\/attachments"/' $settingsfile
sed -i '' 's/"targetDocPath": "[^\"]*"/"targetDocPath": "\/4minitz_storage\/protocols"/' $settingsfile

sed -i '' 's/"format": "[^\"]*"/"format": "pdfa"/' $settingsfile
sed -i '' 's/"pathToWkhtmltopdf": "[^\"]*"/"pathToWkhtmltopdf": "\/usr\/bin\/xvfb-run"/' $settingsfile
sed -i '' 's/"wkhtmltopdfParameters": "[^\"]*"/"wkhtmltopdfParameters": "\-\-server-args=\\"-screen 0, 1024x768x24\\" \/usr\/bin\/wkhtmltopdf --no-outline --print-media-type --no-background"/' $settingsfile
sed -i '' 's/"pathToGhostscript": "[^\"]*"/"pathToGhostscript": "\/usr\/bin\/gs"/' $settingsfile
sed -i '' 's/"pathToPDFADefinitionFile": "[^\"]*"/"pathToPDFADefinitionFile": "\/PDFA_def.ps"/' $settingsfile


#### Build 4Minitz with meteor
(cd .. && ./BUILD_DEPLOY.sh)
rm -rf ./4minitz_bin
mv ../.deploy/4minitz_bin . || exit 1

#### Build 4Minitz docker image
docker build \
        --no-cache -t "$baseimagetag" \
        --build-arg BUILD_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` \
        --build-arg VCS_REF=`git rev-parse --short HEAD` \
        --build-arg VERSION=`git describe --tags --abbrev=0` \
        .
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
rm -rf ./4minitz_bin
