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

### LDAP Configuration

[... describe base configuration fields...]

Now that you have configured 4minitz to allow LDAP login, all your 
users should be able to login with their LDAP username & passwords. On 
first login of an LDAP user, this user (username & email address, user 
long names) are copied into the 4minitz user database. Password lookup 
happens over LDAP, so no passwords or hashes are stored for LDAP users 
in the 4minitz user database. This is needed to store e.g. user access 
rights for meeting minutes.

#### Syncing LDAP users to the 4minitz user database
All LDAP users that have logged in at least once will show up in he 
type-ahead drop down lists when inviting users to a meeting series or 
assigning topics or action items. Users that have never signed in 
won't show up in the type-ahead drop downs. If you want all users of 
your LDAP directory to show up in the type-ahead drop downs 4minitz 
comes with a handy import script. __importUsers.js__
 
If you have configured and tested your LDAP settings in settings.json 
(i.e., users can log in via LDAP) you may import all usernames and 
email addresses (not the password hashes!) from LDAP into the 4minitz 
user data base with the following script:

    cd [path-to-4minitz]
    meteor node ./private/ldap/importUsers.js -s settings.json -m mongodb://localhost:3001/meteor
    
_Note: if you run 4minitz on the default port 3000, then the mongoDB usually runs on the default port 3001 - otherwise adapt the
mongo db port to your installation_

It is OK to run the script multiple times, it only adds new users that 
are available in LDAP but not in 4minitz user database. If email 
addresses or user long names changed in LDAP for a given username, the 
script updates these fields in the 4minitz user database.

_Note: The LDAP "uid" and the the 4minitz user database field 
"username" are considered as primary key in the import step. But it is 
important to note that comparison is done __case-insensitive__ as 
[meteor considers no case on usernames during login](https://guide.meteor.com/accounts.html#case-sensitivity)_
