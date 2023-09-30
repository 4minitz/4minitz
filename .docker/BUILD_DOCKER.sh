#!/usr/bin/env bash

set -e -u
cd "$(dirname "$0")"/../

dockerproject=4minitz/4minitz
commitshort=$(git rev-parse --short HEAD 2>/dev/null | sed "s/\(.*\)/\1/")
baseimagetag=$dockerproject:gitcommit-$commitshort

unset build_image show_usage
tags=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-image)
      build_image="yes"
      shift
      ;;
    --image-name)
      shift
      dockerproject="$1"
      shift
      ;;
    --help)
      show_usage="yes"
      shift
      ;;
    --tags)
      shift
      IFS=','
      read -ra tags <<<"$1"
      shift
      break
      ;;
    *)
      echo "Unkown option: $1"
      show_usage="yes"
      break
      ;;
  esac
done

if [[ -n ${show_usage:-} ]]; then
  echo ""
  echo "Usage: ./BUILD_DOCKER.sh [--build-image] [--image-name USER/IMAGE] [--tags TAGS]"
  echo ""
  echo " --build-image   Build a Docker image after preparing the build. Without"
  echo "                 this flag this script only prepares the build in ./.deploy."
  echo " --image-name    Choose a different image name. Default is $dockerproject."
  echo " --tags          TAGS is a comma separated list of tags that will also be applied"
  echo "                 to the image built."
  echo ""
  echo " Examples:"
  echo "   ./BUILD_DOCKER.sh"
  echo "   ./BUILD_DOCKER.sh --build-image --tags master,stable,latest,0.9.1"
  echo "   ./BUILD_DOCKER.sh --build-image --tags develop,unstable"
  echo "   ./BUILD_DOCKER.sh --build-image --image-name johndoe/4minitz --tags master,stable,latest,0.9.1"
  echo "       The default docker project is '$dockerproject'"
  echo ""
  exit 1
fi

echo "Docker Project   : '$dockerproject'"
echo "Target Base Image: '$baseimagetag'"
echo ""

#### Prepare settings.json
settingsfile=.docker/4minitz_settings.json
cp settings_sample.json "$settingsfile"
echo "Patching $settingsfile"
sed -i '' 's/"ROOT_URL": "[^\"]*"/"ROOT_URL": "http:\/\/localhost:3100"/' "$settingsfile"
sed -i '' 's/"topLeftLogoHTML": "[^\"]*"/"topLeftLogoHTML": "4Minitz [Docker]"/' "$settingsfile"
sed -i '' 's/"mongodumpTargetDirectory": "[^\"]*"/"mongodumpTargetDirectory": "\/4minitz_storage\/mongodump"/' "$settingsfile"
sed -i '' 's/"storagePath": "[^\"]*"/"storagePath": "\/4minitz_storage\/attachments"/' "$settingsfile"
sed -i '' 's/"targetDocPath": "[^\"]*"/"targetDocPath": "\/4minitz_storage\/protocols"/' "$settingsfile"

sed -i '' 's/"format": "[^\"]*"/"format": "pdfa"/' "$settingsfile"
sed -i '' 's/"pathToWkhtmltopdf": "[^\"]*"/"pathToWkhtmltopdf": "\/usr\/bin\/xvfb-run"/' "$settingsfile"
sed -i '' 's/"wkhtmltopdfParameters": "[^\"]*"/"wkhtmltopdfParameters": "\-\-server-args=\\"-screen 0, 1024x768x24\\" \/usr\/bin\/wkhtmltopdf --no-outline --print-media-type --no-background"/' "$settingsfile"
sed -i '' 's/"pathToGhostscript": "[^\"]*"/"pathToGhostscript": "\/usr\/bin\/gs"/' "$settingsfile"
sed -i '' 's/"pathToPDFADefinitionFile": "[^\"]*"/"pathToPDFADefinitionFile": "\/PDFA_def.ps"/' "$settingsfile"

#### Build 4Minitz with meteor
./BUILD_DEPLOY.sh

# Build Docker image - if requested
if [[ -n ${build_image:-} ]]; then
  echo Build 4Minitz docker image

  cp "$settingsfile" .deploy/4minitz_bin/4minitz_settings_docker.json # will be copied to /4minitz_settings.json by Dockerfile later
  docker build \
    -f .docker/Dockerfile \
    --no-cache -t "$baseimagetag" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
    --build-arg VERSION="$(git describe --tags --abbrev=0)" \
    .deploy/

  echo "--------- CCPCL: The 'Convenience Copy&Paste Command List'"
  echo "docker push $baseimagetag"
  pushlist="docker push $baseimagetag"

  # iterate over list of tags
  for var in "${tags[@]}"; do
    echo "tagging as $var"
    imgtag=$dockerproject:$var
    docker tag "$baseimagetag" "$imgtag"
    pushcmd="docker push $imgtag"
    echo "$pushcmd"
    pushlist="$pushlist && $pushcmd"
  done
  echo "---------"
  echo "$pushlist"
fi
