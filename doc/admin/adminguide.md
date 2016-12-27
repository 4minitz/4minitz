# 4Minitz Admin Guide

## Installation

### Prerequisites
Install current version of meteor (which will install node & mongodb if not present):


    curl https://install.meteor.com/ | sh

### Quick Installation    
**Attention:** This installation mode is for *quick testing only*.
It is intended for developers and so it has some security drawbacks 
and also consumes some amount of extra RAM (>700 MB)).
See production installation below for the "pro way" of doing it.

**If you tested and liked 4Minitz, then we recommend the "Production Installation" chapter below**

    git clone --depth 1 https://github.com/4minitz/4minitz.git
    cd 4minitz
    cp settings_sample.json settings.json
    ./runapp.sh

Wait some time for meteor to finish downloading and building. 
You can reach 4minitz via the default port 3100 by opening [http://localhost:3100](http://localhost:3100) in your browser

If you want to run 4Minitz on a different port than the default port, you can do so by providing the port the the above runapp.sh script like so:

    ./runapp.sh 4321

Note: you might need sudo rights to open a port below 1024.

**Attention:**
This quick installation has the advantage that you don't have to
install node, you don't have to mess with a MongoDB database, as 
both tools come with meteor as sub packages.
But while the quick installation mode is - well - quick, it has some
drawbacks:

 1. It uses meteor's own MongoDB where it sets up users & collections that
   are accesible to everyone who has shell access to the PC the database is
   running on. Nevertheless as of this writing the DB port is not opened to
   the outside world. So, if you are the only person that can login 
   to the machine - may be you are fine with this.
 1. The meteor tool is a build environment. Among many other things meteor
   watches the source files of 4Minitz and rebuilds on changes. This
   is great for developers. But it comes to the price of some extra need
   from RAM. Recent measurements showed, 4Minitz needs about 700 MB of RAM
   when launched via meteor vs. 90 MB of RAM when directly launched via node
   without meteor build support. So, if your (virtual?) machine has enough
   RAM - may be you are fine with this.

In all other cases - read on and chose the "Production Installation" way.


### Production Installation
[This Chapter is 'Work-in-Progress']
After you installed meteor (see above), you should install and launch a
separate MongoDB instance. Make sure you secured access by username and
password. This instance may or may not be on the same machine as 4Minitz.
There are lots of how-to on installing MongoDB out there.

Then perform the following steps:

    git clone --depth 1 https://github.com/4minitz/4minitz.git
    
    cd 4minitz
    mkdir ../4minitz_bin
    meteor build ../4minitz_bin --directory
    cp settings_sample.json ../4minitz_bin/bundle/settings.json

    cd ../4minitz_bin/bundle
    meteor npm install
    nano settings.json

Now you should configure your settings.json to your needs.
Then set the following environment variables (where 21181 is the
port where MongoDB listens and 61405 will be the port where
4Minitz will be reachable):

    export MONGO_URL='mongodb://MONGOUSER:MONGOPASSWORD@localhost:21181/'
    export PORT=61405
    export ROOT_URL='http://4minitz.example.com:61405'
    export METEOR_SETTINGS=$(cat ./settings.json)

Now you can launch the 4Minitz WebApp:

    meteor node main.js

Now you should reach your 4Minitz instance via:

    http://4minitz.example.com:61405


## Configuration with settings.json
Take a look at ```settings_sample.json``` at the top level folder of 4Minitz.
 You may rename this file to ```settings.json``` and then edit its contents to your need.
Afterwards launch the 4Minitz server with this settings.json either via the
```runapp.sh``` skript or via ```meteor --production --settings settings.json --port 3100``` 
 
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

#### Available configuration options
See your settings.json file:

| Setting           | Default | Explanation                                                                 |
|-------------------|---------|-----------------------------------------------------------------------------|
| enabled           | false   | Enables & disables LDAP login                                               |
| searchDn          | "cn"    | The attribute used as username                                              |
| searchFilter      | ""      | Additional search filters, e.g. "(objectClass=inetOrgPerson)"               |
| serverDn          | ""      | Your server base dn, e.g. "dc=example,dc=com"                               |
| serverUrl         | ""      | Server url, e.g. "ldaps://ldap.example.com:1234                             |
| whiteListedFields | []      | Attributes that are copied into the user's profile property                 |
| autopublishFields | []      | Meteor will publish these fields automatically on users                     |
| allowSelfSignedTLS| false   | If enabled, self-signed certs will be allowed for the Meteor server process |

Once you have configured 4minitz to allow LDAP login, all your 
users should be able to login with their LDAP username & passwords. On 
first login of an LDAP user, this user (username & email address, user 
long names) are copied into the 4minitz user database. Password lookup 
happens over LDAP, so no passwords or hashes are stored for LDAP users 
in the 4minitz user database. This is needed to store e.g. user access 
rights for meeting minutes.

#### Importing LDAP users to the 4minitz user database
All LDAP users that have logged in at least once will show up in the 
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
    node ./private/ldap/importUsers.js -s settings.json -m mongodb://localhost:3001/meteor
    
_Note: if you run 4minitz on the default port 3000, then the mongoDB usually runs on the default port 3001 - otherwise adapt the
mongo db port to your installation_

It is OK to run the script multiple times, it only adds new users that 
are available in LDAP but not in 4minitz user database. If email 
addresses or user long names changed in LDAP for a given username, the 
script updates these fields in the 4minitz user database. The script 
never deletes any users from the 4minitz user database. Granted access 
right to meeting series or minutes are not changed on existing users 
by the importUsers.js script. 

_Note: The LDAP setting "searchDn" and the the 4minitz user database field 
"username" are considered as primary key in the import step. But it is 
important to note that comparison is done __case-insensitive__ as 
[meteor considers no case on usernames during login](https://guide.meteor.com/accounts.html#case-sensitivity).

### Configuring Upload of Binary Attachments
If this feature is switched on, users may upload binary attachments
to a non-finalized meeting protocol. This is especially cool as
users may login to the current meeting minutes with their smart
device, take a snapshot - e.g. of a filled white board - and then directly
upload the photo to the current meeting minutes.

For detailed setting options for binary attachments take a look at the 
```settings_sample.json``` section ```attachments```.
Here you can specify things like:
* switch on/off the upload binary attachments feature
* absolute or relative path to the stored files
* allowed or denied file extensions
* maximum file size per upload.

Some hints:
* If the feature is switched off, it is not possible to upload, remove or
download attachments via the webapp.
* Users are not able to see or download attachments for meetings where
they are not invited. Users are only able to upload attachtments to
meeting series where they have either the moderator or uploader role.
* If you toggle the feature on => off no files will be deleted. 
So it's save to switch the feature off temporarily.  
* The file system path where attachments are stored may be relative
or absolute. During launch the server will output the full path to your
uploaded attachments directory. It is a good idea to put this path
into you backup strategy.
* Inside the attachments directory the files will be grouped
by ID of the parent meeting series.
* During launch the server will check if the attachment directory 
is writeable. If not, an error will occur in the server log. 
You know what to do here, right?
* via allowExtensions and denyExtensions you can either allow all 
and deny some (e.g. *.exe) or you can allow only some 
(e.g. *.ppt) - in this case the deny pattern may be empty.
These settings will only affect future uploads.
* The maximum file size is specified in bytes and affects only
future uploads. So a value of 10485760 will mean 10 MB 
(as 10 * 1024 * 1024 = 10485760).  
* If you want to find out how many attachments exist at all and how
much storage space they occupy, you may open the client statistics.
Open the about box and click on the 4Minitz logo to show/hide the
server statistics.