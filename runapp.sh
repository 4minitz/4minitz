#!/usr/bin/env bash

# Simple shell script wrapper to launch this meteor webapp
# ./runapp.sh         - launches app on default port 3100
# ./runapp.sh 4321    - launches app on port 4321

PORT4APP="3100"
if [ ! -z "$1" ]; then
  PORT4APP=$1
  echo "$PORT4APP"
fi
echo Port "$PORT4APP"

# Find path of currently running script
TARGET_FILE=$0
cd "$(dirname "$TARGET_FILE")" || exit
TARGET_FILE=$(basename "$TARGET_FILE")

# Iterate down a (possible) chain of symlinks
while [ -L "$TARGET_FILE" ]; do
  TARGET_FILE=$(readlink "$TARGET_FILE")
  cd "$(dirname "$TARGET_FILE")" || exit
  TARGET_FILE=$(basename "$TARGET_FILE")
done

# Compute the canonicalized name by finding the physical path
# for the directory we're in and appending the target file.
SCRIPTPATH=$(pwd -P)
cd "$SCRIPTPATH" || exit

if [ ! -f ./settings.json ]; then
  echo ""
  echo "ERROR!"
  echo "Could not find settings.json in:"
  echo "    " "$SCRIPTPATH"
  echo "Please copy settings_sample.json to settings.json"
  echo "and adapt settings.json to your needs."
  echo "Then retry to run this script"
  echo ""
  exit 1
fi

# Protocol which meteor version we are running at
meteor --version

# Install the needed dependencies
meteor npm install --production

echo ""
echo "WARNING!"
echo "This script is only for quick testing and not"
echo "for production use. It stores all data in an"
echo "unprotected MongoDB database and needs way too"
echo "much RAM."
echo "To run a production server consult the admin guide:"
echo "https://github.com/4minitz/4minitz/blob/master/doc/admin/adminguide.md"
echo ""

# Let client download all available localizations so that our custom accounts-ui
# translations are mapped correctly (see imports/config/accounts.js)
export UNIVERSE_I18N_LOCALES='all'

# Run app on specific port
meteor --production --settings settings.json --port "$PORT4APP"
