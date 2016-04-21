# 4minitz!

Simply the best app for taking minutes.

Documentation is "continously" not finished... Nevertheless these WIP docs may be of help:

* [User Doc](doc/user/usermanual.md)
* [Admin Guide](doc/admin/adminguide.md)
* [Developer Doc](doc/developer/developermanual.md)

## Quick Start
### Prerequisites
1. Install current version of node.js
   Make sure, node & npm is in the PATH.

1. Install current version of mongodb
   Make sure, mongod is in the PATH.

1. Install current version of meteor:


    curl https://install.meteor.com/ | sh

### Installation of 4minitz    

    git clone --depth 1 https://github.com/4minitz/4minitz.git
    cd 4minitz
    meteor --production

### Running tests

In oder to execute tests you need to run the following meteor command.

    meteor test --driver-package practicalmeteor:mocha

Optionally add commandline switch *--port 3100* to run tests in parallel to the meteor application.

Further info on testing with meteor can be found at http://guide.meteor.com/testing.html
