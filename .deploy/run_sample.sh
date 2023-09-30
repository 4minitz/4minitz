#!/usr/bin/env bash

echo "You must adapt the below environment vars in this script to your needs!"
echo "Then remove the following exit command"
echo "Exiting now!"
exit

############### Environment configuration ######
# Connection to your mongodb server (please ensure password protection and encrypted communication!)
export MONGO_URL='mongodb://USER:PASSWORD@localhost:27017/'
# Port for your 4Minitz server
export PORT=3100
# Port to your 4Minitz root URL (to generate correct links in EMails)
# the leading http:// or https:// is IMPORTANT!
export ROOT_URL='http://localhost:3100'
# Read in your settings.json
export METEOR_SETTINGS="$(cat ./settings.json)"
#################################################

#### Check if installed node version matches the node build version
nodeversionbuild=$(cat ./bundle/.node_version.txt)
nodeversionnow=$(node --version)
if [ "$nodeversionbuild" != "$nodeversionnow" ]; then
  echo " "
  echo "*** WARNING!"
  echo "    Node version mismatch:"
  echo "    Node version on build: $nodeversionbuild"
  echo "    Node version now     : $nodeversionnow"
  echo "If app has launch errors, use node version manager:"
  echo "     nvm install $nodeversionbuild &&  nvm use $nodeversionbuild"
  echo " "
  sleep 5
fi

#### Launch the 4Minitz server
(cd bundle && node main.js)
