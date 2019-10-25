
master/ [![Build Status](https://api.travis-ci.org/hkalinke/4minitz.svg?branch=master)](https://travis-ci.org/hkalinke/4minitz)
develop/ [![Build Status](https://api.travis-ci.org/hkalinke/4minitz.svg?branch=develop)](https://travis-ci.org/hkalinke/4minitz)
[![Code Climate](https://codeclimate.com/github/4minitz/4minitz/badges/gpa.svg)](https://codeclimate.com/github/4minitz/4minitz)
[![Docker Pulls](https://img.shields.io/docker/pulls/4minitz/4minitz.svg)](https://hub.docker.com/r/4minitz/4minitz/)
[![CLA assistant](https://cla-assistant.io/readme/badge/4minitz/4minitz)](https://cla-assistant.io/4minitz/4minitz)


# 4Minitz!

*Simply ~~the best~~ a decent free webapp for taking meeting minutes.*

* Create a meeting series and invite others
* Specify moderators, invited and informed users
* Create an agenda with multiple topics
* Attend a meeting via web with reactive live updates
* 1-button sending of agenda, minutes and action items by email 
* Use labels to tag items for later retrieval
* Upload binary attachments to minutes (e.g., presentations, photos)
* Track open action items and unfinished topics across meetings
* Full privacy: Host your own server - it's easy!

<a href="https://raw.githubusercontent.com/4minitz/4minitz/develop/doc/4minitz_screenshot.png"><img src="https://raw.githubusercontent.com/4minitz/4minitz/develop/doc/4minitz_screenshot.png" width="500" ></a>

*(Click to enlarge screen shot)*

<br>

[![4Minitz Demo Video](doc/4Minitz_Youtube_Thumbnail.png)](https://www.youtube.com/watch?v=v28q6AaEySQ)

*(Click to play Demo Video)*

Documentation is "continuously" not finished... Nevertheless these WIP docs may be of help:

* [FAQ - Frequently Asked Questions](doc/faq.md)
* [User Doc](doc/user/usermanual.md)
* [Admin Guide](doc/admin/adminguide.md)
* [Developer Doc](doc/developer/developermanual.md)

## External Project Links
* [4Minitz Backlog](https://github.com/4minitz/4minitz/projects/1) - organizes our project TODOs
* [4Minitz Demo Server](https://www.4minitz.com) - well, our Demo server ;-)
* [TravisCI](https://travis-ci.org/4minitz/4minitz) - Runs unit and end2end tests on each commit
* [Code Climate](https://codeclimate.com/github/4minitz/4minitz) - Keeps an eye on our code quality 
* [CLA Assist](https://cla-assistant.io/4minitz/4minitz) - Manages signing of our Contributor License Agreements 
* [Docker Hub](https://hub.docker.com/r/4minitz/4minitz/) - Spin up your own 4Minitz server in seconds 

## 4Minitz is proudly sponsored by
<a href="http://www.methodpark.de"><img src="https://raw.githubusercontent.com/4minitz/4minitz/develop/doc/sponsor_methodpark.png" height="50px" alt="Method Park"></a>

## Quick Start
You have two options to quickly evaluate a local demo 
installation at your site.

1. Use our ready-to-go docker image (recommended!) or
1. Install meteor. Then build and run 4Minitz locally


### Option 1: Use 4Minitz docker image (Linux, Mac & Windows)
**Attention:** Option 1 is only one possibility of running a production
server.
Don't miss the [Admin Guide](doc/admin/adminguide.md)
with a more comprehensive coverage of the real production
building & installation topic!

The 4Minitz docker image includes the compiled 4Minitz app, a fitting 
node.js version and MongoDB and thus has no external dependencies.

See the admin guide for
[how to configure your 4Minitz docker server](doc/admin/adminguide.md#production-running---with-docker).


### Option 2: Clone, build & run your own (Linux, Mac)
**Attention:** Option 2 is for quick testing only.
It is intended for developers and so it has some security drawbacks (No
password protection for MongoDB) and also consumes some amount of extra RAM
(>700 MB)). Don't miss the [Admin Guide](doc/admin/adminguide.md)
with a more comprehensive coverage of the real production installation topic!

#### Prerequisites
4minitz is realized with the [Meteor JS Framework](http://www.meteor.com). So, first install the current version of meteor:

    curl https://install.meteor.com/ | sh
    meteor --version

To download fresh code form github you will need `git` in your path.

You'll need root rights for that. As a non-root user you may install
meteor by:

    git clone --depth 1 --recursive https://github.com/meteor/meteor.git
    cd meteor
    meteor --version
    sudo ln -s ./meteor /usr/local/bin/meteor

On Windows? [Download the meteor installer](https://install.meteor.com/windows). 
As experienced Windows admin you sure can transfer the below steps for Linux and Mac to your OS.

#### Quick Installation of 4Minitz (Linux & Mac)   
OK, here we go! For a quick test installation perform:

    git clone --depth 1 https://github.com/4minitz/4minitz.git --branch master --single-branch
    cd 4minitz
    cp settings_sample.json settings.json
    ./runapp.sh

Wait some time for meteor to finish downloading and building. 
You can reach 4Minitz via the default port 3100 by opening 
[http://localhost:3100](http://localhost:3100) in your browser

**Hint:** There exists a settings_sample.json file that has quite a few configuration options
(like sending eMails etc.). Don't miss the [Admin Guide](doc/admin/adminguide.md) with more details
 on this topic.
 
