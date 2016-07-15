# 4Minitz Admin Guide

## Setup

### Prerequisites
Install current version of meteor (which will install node & mongodb if not present):


    curl https://install.meteor.com/ | sh

### Installation of 4Minitz    


    git clone --depth 1 https://github.com/4minitz/4minitz.git
    cd 4minitz
    meteor npm install
    meteor --production

Wait some time for meteor to finish building. 
You can reach 4minitz via the default port 3000 by opening [http://localhost:3000](http://localhost:3000) in your browser


### Database configuration

Database related configuration is collected under the ```db``` object in your settings.json. These options are available:

* ```mongodumpTargetDirectory```: The output directory where 4minitz will store the database contents before
  the database schema is updated. If this is not set or empty no backup will be created.


### Configuration for sending emails

You can send emails either via smtp or [mailgun](http://www.mailgun.com/). To enable email sending you have to provide
your custom settings.json file where you have to define your smtp settings or mailgun api key.
Then simply run the application and pass your settings file as program argument:

    meteor --production --settings path/to/settings.json

See /settings_sample.json for an example. Do not forget to set "enableMailDelivery" to true and set "mailDeliverer"
to either "mailgun" or "smtp" - not both as seen in the example file!

If you enable the option "trustedIntranetEvironment" the finalize-info-email will be sent once with all recipients in
the "TO:" field. Disable this option in public or demo mode!