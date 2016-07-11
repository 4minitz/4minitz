# 4Minitz!

*Simply the best free webapp for taking minutes.*

* Create a meeting series and invite others
* Specify moderators, invited and informed users
* Create an agenda with multiple topics
* Attend a meeting via web with reactive live updates
* 1-button sending of minutes and action items by email 
* Use labels to tag items for later retrieval
* Track open action items and unfinished topics across meetings
* Full privacy: Host your own server - it's easy!

**Important: 4Minitz is currently WIP and not yet ready for mission critical usage. 
Nevertheless, quite a few featrues are working stable already and you can head over to our
[4Minitz Demo Server](https://www.4minitz.de) and and play around or install the current 
version on your own server (see below)** 

Documentation is "continously" not finished... Nevertheless these WIP docs may be of help:

* [User Doc](doc/user/usermanual.md)
* [Admin Guide](doc/admin/adminguide.md)
* [Developer Doc](doc/developer/developermanual.md)

## Build status (by [TravisCI](https://travis-ci.org))
|Branch|  |
|---|---|
|master|[![Build Status](https://travis-ci.org/4minitz/4minitz.svg?branch=master)](https://travis-ci.org/4minitz/4minitz)|
|develop|[![Build Status](https://travis-ci.org/4minitz/4minitz.svg?branch=develop)](https://travis-ci.org/4minitz/4minitz)|

## Backlog (by [waffle.io](https://www.waffle.io))
[![Stories in Ready](https://badge.waffle.io/4minitz/4minitz.svg?label=ready&title=Ready)](http://waffle.io/4minitz/4minitz) 


## Quick Start
### Prerequisites
4minitz is realized with the [Meteor JS Framework](http://www.meteor.com). So, first install the current version of meteor:


    curl https://install.meteor.com/ | sh

### Installation of 4Minitz    

    git clone --depth 1 https://github.com/4minitz/4minitz.git
    cd 4minitz
    meteor npm install
    meteor --production

Wait some time for meteor to finish building. 
You can reach 4minitz via the default port 3000 by opening [http://localhost:3000](http://localhost:3000) in your browser

**Hint:** There exists a settings_sample.json file that has quite a few configuration options
(like sending eMails etc.). Don't miss the [Admin Guide](doc/admin/adminguide.md) with more details
 on this topic.
 