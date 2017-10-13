# 4Minitz Admin Guide

# Installation

## Whats wrong with the 'Quick Installation' (Option 2)?    

The [quick installation](../../README.md#quick-installation-of-4minitz) (Option 2)
has the advantage that you don't have to
install node and you don't have to mess with a MongoDB database, as 
both tools come with the meteor development tool as sub packages.

But while the quick installation mode is - well... - quick, it has some
drawbacks:

 1. It uses meteor's own MongoDB where it sets up collections that
   are accessible to everyone who has shell access to the PC the database is
   running on. So, no login is needed to access the DB.
   Nevertheless as of this writing the DB port is not opened to
   the outside world. So, if you are the only person that can login 
   to the machine - may be you are fine with this.
 1. The meteor tool is a development tool. Among many other things meteor
   watches the source files of 4Minitz and rebuilds on changes. This
   is great for developers. But it comes to the price of some extra need
   from RAM. Recent measurements showed, 4Minitz needs about 700 MB of RAM
   when launched via meteor vs. 90 MB of RAM when directly launched via node
   without meteor build support. So, if your (virtual?) machine has enough
   RAM - may be you are fine with this, too.

In all other cases - read on and choose the "Production Installation" way.

## Production Server Setup with Docker
The 4Minitz docker image includes the compiled 4Minitz app, a fitting 
node.js version and MongoDB and thus has no external dependencies.

### Docker Setup on Linux and Mac

1. Install [docker](https://docs.docker.com/engine/installation/)
2. In a directory where you have write access run:
```
docker run -it --rm -v $(pwd)/4minitz_storage:/4minitz_storage -p 3100:3333 4minitz/4minitz
```

Omit the next section and continue with the section [Use your 4minitz container](#use-your-4minitz-container).

### Docker Setup on Windows

On Microsoft Windows 10 Professional or Enterprise 64-bit you can run 4minitz inside a docker container. The following snippets should be run inside a PowerShell (indicated by a `PS>` prompt) or a bash shell inside a Docker container (indicated by a `root#` prompt).

1. Install [docker](https://docs.docker.com/engine/installation/)
2. Open up a powershell and pull the 4minitz image from the Docker hub
```
PS> docker pull 4minitz/4minitz
```
3. Create a container instance called `4minitz-storage`
```
PS> docker create -v /4minitz_storage --name 4minitz-storage 4minitz/4minitz
```
4. If you want to edit the configuration, especially after updating your 4minitz images, you should do so in an up-to-date 4minitz container by spawning a bash shell into it. For now it suffices to simply start the volume container and edit the config file `4minitz_settings.json`:
```
PS> $docker = docker ps -q -l
PS> docker start $docker
PS> docker exec -ti $docker /bin/bash
root# nano /4minitz_storage/4minitz_settings.json
root# exit
PS> docker stop $docker
```
4. Now you can use this data volume container in a 4minitz container:
```
PS> docker run -it --rm --volumes-from 4minitz-storage -p 3100:3333 4minitz/4minitz
```

See [this guide](https://docs.docker.com/engine/tutorials/dockervolumes/#backup-restore-or-migrate-data-volumes) on how to backup and restore the data in your data volume container.


### Use your 4minitz Docker container

You can reach 4Minitz via the default port 3100 by opening 
[http://localhost:3100](http://localhost:3100) in your browser

The docker container will write all data to your local host
machine into `./4minitz_storage` outside of the container
(Linux and Mac) or in your data volume container (Windows).
Here you will find 
* **4minitz_settings.json** - adapt server settings here. Then "Ctrl+c" 
  and restart the 4Minitz container.
* **log** - here are MongoDB and 4Minitz logs - if something does not work.
* **attachments** - all attachments that have been uploaded
  to meeting minutes are stored here.
* **4minitz_mongodb** - MongoDB "--dbpath"


### Updating your 4minitz Docker container

If a new version of 4Minitz is released, you may keep the above storage 
directory or data volume container. Simply Ctr+c the running container, and perform a `docker pull 4minitz/4minitz`. 
When you re-launch the container afterwards, all clients will get 
the new WebApp version automatically via meteors hot-code push.

**Security Hints:**
1. The embedded mongoDB inside the docker container is not protected
 by user/password, so make sure nobody else is allowed to attach /
  exec commands to your running container
1. The outside host directory `./4minitz_storage` or docker volume container
   should only be read/write accessible by the 4minitz admin. Otherwise 
   unauthorized users may see attachments, copy the database or change 
   settings.json.
1. Do not allow users to connect directly to your 4Minitz container.
  Instead configure a reverse proxy with TSL / https: to make sure
  that all traffic between client and server is encrypted.



## Production Server by Building From Source
If you can not (or don't want to) use the ready-to-run docker image
(see above), you can instead build and run your own 4Minitz server
from source.
 
### Prerequisites
#### C++11 compiler
As of version 1.4 meteor needs to build some binary npm packages during build phase. Make sure you have a C++11 compiler in your path, as this is needed by the node eco system of modules.

**On MacOS** make sure you have up-to-date XCode commandline installed. To do so launch `gcc` from the commandline. If it is not installed, it will tell you what to do.

**On Linux** perform a `gcc --version` should at least deliver a **"4.8.x"**.
 If your gcc is older, consult your Linux distribution how-tos on how to upgrade. A good version switcher is [update-alternatives](https://linux.die.net/man/8/update-alternatives).

#### Installation of Git
To obtain the sources you may download the current [source ZIP from github](https://github.com/4minitz/4minitz/releases).

But the prefered way is to clone the sources via git. So, make sure that `git --version` shows a version 2.x and produces 
no error on your machine. ;-)

#### Installation of Meteor
4minitz is realized with the [Meteor JS Framework](http://www.meteor.com). 
So, to be able to build the sources in a runnable server, first 
install the current version of the meteor build tool:

    curl https://install.meteor.com/ | sh
    meteor --version

You'll need root rights for the above. As a non-root user you may install
meteor by:

    git git clone --depth 1 --recursive https://github.com/meteor/meteor.git
    cd meteor
    meteor --version

On Windows? [Download the meteor installer](https://install.meteor.com/windows). 


#### Installation of MongoDB
After you installed meteor (see above), you should install and launch a
separate MongoDB instance. Make sure you secure the access by username and
password. This MongoDB instance may or may not be on the same machine as 4Minitz.
There are lots of how-to on [installing MongoDB out there](https://docs.mongodb.com/manual/installation/).

As a first hint this might help:

    mongod --dbpath=/path/to/my/datadirecotry

This should make the mongodb available on the default port 27017 so that the following mongo URL should work:

    export MONGO_URL='mongodb://localhost:27017/'
 
**Attention** The above configuration does not enforce secure SSL communication to your mongodb. So if you run mongoDB and 4Minitz on 
 different machines you should take a look at the [MongoDB Transport Encryption](https://docs.mongodb.com/manual/core/security-transport-encryption/) doc.
 
**Attention** The above configuration does not enforce users to log in. 
See the [MongoDB Enable Auth](https://docs.mongodb.com/manual/tutorial/enable-authentication/) doc for information on this topic 

### Building and Running of 4Minitz
**Note:** *The following steps assume you have no local node / npm installed.
So, we use the meteor bundled node / npm for building and running 4Minitz.
If you have a suited node / npm installed (as of this writing: 
Node 4.6.2 is needed), you may use ```npm``` instead of ```meteor npm```
 and ```node``` instead of ```meteor node``` in the steps below.*

Perform the following steps to build an run the 4Minitz server:

    git clone --depth 1 https://github.com/4minitz/4minitz.git --branch master --single-branch
    
    cd 4minitz
    meteor npm install
    # if the above fails, install node > v6.x and run 'npm install'
    mkdir ../4minitz_bin
    meteor build ../4minitz_bin --directory
    cp settings_sample.json ../4minitz_bin/bundle/settings.json

    cd ../4minitz_bin/bundle/programs/server
    meteor npm install --production
    
    cd ../..
    nano settings.json

Now you should configure your settings.json to your needs.

Then set the following environment variables (where 27017 is the
port where MongoDB listens and 61405 will be the port where
4Minitz will be reachable via web browser):

    export MONGO_URL='mongodb://MONGOUSER:MONGOPASSWORD@localhost:27017/'
    export PORT=61405
    export ROOT_URL='http://4minitz.example.com:61405'
    export METEOR_SETTINGS=$(cat ./settings.json)

Now, inside the `/4minitz_bin/bundle/programs/server` directory,
you must launch the 4Minitz server:

    meteor node main.js

Now, you should be able to reach your 4Minitz instance via:

    http://localhost:61405
    or
    http://4minitz.example.com:61405


## Configuration with settings.json
Take a look at ```settings_sample.json``` at the top level folder of 
4Minitz.  You may copy this file to ```settings.json``` and then edit
its contents to your need.

If you already have a running production server as described above: don't
forget to refresh changes of your settings.json into the environment 
variable: ```export METEOR_SETTINGS=$(cat ./settings.json)```. Then
 re-start your 4Minitz server with ```meteor node main.js```.

### How to become a frontend admin?
Some frontend admin functionality can also be reached when you 
logged in  to the 4Minitz frontend via your browser.
Click the "Admin Tasks" nav bar menu entry to show possible 
options. On the admin view you may, for example:

* **Register new users** for standard login.
  (Sorry, no LDAP registering!). When you
   filled all necessary fields, you can specify
   if the new user will receive a welcome eMail with
   her login credentials.
* **Show and filter** all registered users
* **De/Activate user accounts.** Inactive users will
  not be able to log in the the WebApp anymore. But
  their account is still visible in all finalized protocols.
  Nevertheless other users cannot invite inactive
  users to meetings or make inactive users responsible 
  for an action item.
* **Send broadcast Messages** to all users. E.g., you
  may send a warning if you do maintenance (backup, anybody?)
  to the 4Minitz server. You can (re-)broadcast, activate,
  remove broadcast messages. Or you may inform users of
  cool features of an updated version.
 
Multiple user accounts can be specified as frontend admin. 
To make 4Minitz recognize you as admin, enter your
database user ID string to the `settings.json` key array `adminIDs`.
For example:
   
`"adminIDs": ["vwuhsQmghXSfqZ3f3", "5yEzZhQ6or44weojX"],`

 On server-side a restart of the server will log all admin account names
 to the server console.
 
 **But how do I find out my own user ID to make me admin?**
 
 First login to the frontend with a registered user account.
 Then you have two options:
 
 * either enter the following to your browser's JavaScript console:
  `Meteor.userId()` and press enter.
 * or open the 4Minitz About box and perform a 
   mouse double click right after the text 
   "About 4Minitz". Then your (previous invisible) user ID
   will show up selected - ready for copy & paste.
   
   ![About Box with selected user ID](./figures/about_my_user_id.png)


### Database configuration

Database related configuration is collected under the ```db``` object in your settings.json. These options are available:

* ```mongodumpTargetDirectory```: The output directory where 4minitz will store the database contents before
  the database schema is migrated (updated). If this is not set or empty no backup will be created.

### Get informed about updates
The 4Minitz team will try to improve the 4Minitz code base. From time to time there may be also an important security fix. Per default your 4Minitz server will ask our master server regularly (about every 8 hrs.) what the current official stable version is. Your server will send your admin an eMail if your server found out such a newer version exists.

The update check will be active if...

1. You did *not* disable the update check like so: `updateCheck: false`
2. You properly configured sending of EMails & SMPT server (`enableMailDelivery`)
3. You configured at least one admin ID (`adminIDs`) and the admin user has a valid mail address  

**Important Privacy Note** The "new version" mail will be generated and sent to you by *YOUR OWN* 4Minitz server. Your personal data (like admin mail address) will newer leave your server.

### Configuration for sending emails

You can send emails either via smtp or [mailgun](http://www.mailgun.com/). To enable email sending you have to provide
your custom settings.json file where you have to define your smtp settings or mailgun api key.

See /settings_sample.json for an example. Do not forget to set "enableMailDelivery" to true and set "mailDeliverer"
to either "mailgun" or "smtp" - not both as seen in the example file!

If you enable the option "trustedIntranetEvironment" the finalize-info-email will be sent once with all recipients in
the "TO:" field. This makes it easy for recipients to "Reply to all". But it
may be a security hole in an untrusted environment. So, disable this option in public or demo mode!

The sender address in an email (FROM: and REPLY-TO:) will be set depending on
* defaultEMailSenderAddress
* fallbackEMailSenderAddress and
* if the sending user has an email specified in her profile.

The following diagram will show the decision tree:
![Decision diagram for email sender](./figures/email_sender.png)


### LDAP Configuration

#### Available configuration options
See your settings.json file:

| Setting             | Default                          | Explanation                                                                 |
|---------------------|----------------------------------|-----------------------------------------------------------------------------|
| enabled             | false                            | Enables & disables LDAP login                                               |
| propertyMap         | {username: 'cn', email: 'mail' } | Map important attributes from ldap to user database                         |
| authentication      | {}                               | Perform a bind before importing users from LDAP. Optional.                  |
| searchFilter        | ""                               | Additional search filters, e.g. "(objectClass=inetOrgPerson)"               |
| serverDn            | ""                               | Your server base dn, e.g. "dc=example,dc=com"                               |
| serverUrl           | ""                               | Server url, e.g. "ldaps://ldap.example.com:1234                             |
| whiteListedFields   | []                               | Attributes that are copied into the user's profile property                 |
| autopublishFields   | []                               | Meteor will publish these fields automatically on users                     |
| inactiveUsers       | {strategy: 'none'}               | Available strategies: 'none', 'userAccountControl' and 'property'. See below for details|
| allowSelfSignedTLS  | false                            | If enabled, self-signed certs will be allowed for the Meteor server process |
| importCronTab       | false                            | If set to a valid crontab string (e.g. `"* 14 5 * * *"` will run every day at 5:14 A.M.), then LDAP users will be imported regularly by the server process. Result is like calling the importsUser.js manually (see below). Syntax for crontab string see: [crontab readme](https://github.com/merencia/node-cron#cron-syntax)|

Once you have configured 4minitz to allow LDAP login, all your 
users should be able to login with their LDAP username & passwords. On 
first login of an LDAP user, this user (username & email address, user 
long names) are copied into the 4minitz user database. Password lookup 
happens over LDAP, so no passwords or hashes are stored for LDAP users 
in the 4minitz user database. This is needed to store e.g. user access 
rights for meeting minutes.

#### Authentication

To perform a bind before importing users from LDAP you can provide
a user dn and a password with the authentication property. E.g.

```
  "authentication": {
    "userDn": "cn=admin, ou=Admins, dc=example, dc=com",
    "password": "p@ssw0rd"
  }
```

#### Available strategies to detect inactive users

* 'none': No attempts are made to detect inactive users. All users in
your LDAP directory will be imported and will be able to login to 4minitz.
* 'property': You can provide a key-value map in a property called
'properties'. If any of the ldap attributes that has the same value as the
given value the user is considered to be inactive and won't be able to login
to 4minitz.
* 'userAccountControl': Checks the *userAccountControl* ldap attribute and
sets the user to inactive if bit 2 of this flag is set. See
[MSDN](https://msdn.microsoft.com/en-us/library/ms680832(VS.85).aspx) for details.

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
phone, take a snapshot - e.g. of a filled white board - and then directly
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
much storage space they occupy, you may open the server statistics
at the client.
Just open the about box and click on the 4Minitz logo to show/hide the
server statistics.

### Configuring protocol generation
By using this feature for each finalized minute a protocol is automatically generated and saved on the file system.
There are three different file formats you can select of: HTML, PDF and PDF/A (2-B).

For the detailed settings options take a look at
```settings_sample.json``` section ```docGeneration```.

A few additional hints:
* Only the minutes finalized after the activation of this feature will generate a protocol. Previously finalized minutes will not have a protocol. Instead by clicking on the download button of these minutes you will be asked if you wish to dynamically generate a HTML protocol. These protocol is however only intended for downloading and will not be stored on the server.
* The setting "pathToWkhtmltopdf" is only relevant **for the formats PDF and PDF/A**. In order to use these you have to install wkhtmltopdf from here: 
https://wkhtmltopdf.org/ 
After installing it you have to assign the full path to it's executable in your settings.json.
* You can configure the **PDF (and therefore the PDF/A)** generation in various ways by using the command line switches of wkhtmltopdf, e.g. to define page margins or page numbering.
You can add any desired switch by adding them to the property "wkhtmltopdfParameters" in your settings.json. For a full list of switches you may have a look here: https://wkhtmltopdf.org/usage/wkhtmltopdf.txt
**Note:** There is a known issue with wkhtmltopdf running on OS/X making the font to appear tiny. Therefore when using an Mac OS/X to host 4Minitz you should consider adding the following switches, which should solve this issue: "--dpi 380 --disable-smart-shrinking"
* The settings "pathToGhostscript", "pathToPDFADefinitionFile", and "ICCProfileType" **only apply for the PDF/A format**. To use these you first have to install ghostscript: 
https://www.ghostscript.com/download/
After this you will need to define a proper so called definition file for PDF/A generation. Ghostscript comes with one sample file you may usually find in "ghostscript/lib/PDFA_def". This file only needs one adjustment in order to be used for 4Minitz: You have to assign the path to a proper ICC Profile File on your local file system. You may use any ICC Profile based on the RGB or the CMYK colour scheme. After that is done you can assign the path to the ghostscript executable, the path to your definition file and the colour scheme of your ICC Profile to the respective settings.


## Safety and Security

### Safety and Backup
To ensure that you do not suffer from loss of data, make sure to
backup your database and your static files directories.

#### Backup of MongoDB data
You may create a backup of your MongoDB database like so:
1. Install the monddb client tools (incl. mongodump)
1. mongodump -h 127.0.0.1 --port 3101 -d meteor
1. zip -r backup-4minitz-$(date +%Y-%m-%d_%H%M%S) ./dump

To restore a backup from a dump
1. meteor reset (if you run mongodb from meteor)
1. mongorestore --host 127.0.0.1 --port 3101 --drop ./dump/

#### Backup of uploaded attachments / generated documents
When your 4Minitz server launches it will print two absolute pathes for you, if you have attachments and document generation enabled. For example:

```
I20170924-12:52:32.302(2)? Attachments upload feature: ENABLED
I20170924-12:52:32.348(2)? attachmentsStoragePath:/home/4minzer/www/attachments_4mindev
I20170924-12:52:32.350(2)? Document generation feature: ENABLED
I20170924-12:52:32.350(2)? Document Storage Path: /home/4minzer/www/protocols_4mindev
```

Please ensure that these directories are included in your regular backups.


### Security
#### Password security
4Minitz uses the meteor [accounts-password](https://docs.meteor.com/api/passwords.html) package. According to the docs passwords are

* Hashed on the client. And only the hash is transferred to the server
* The server then uses salting and bcrypt2 to store the password in the user database.

So, the plain text password never leaves the client. This is good against curious admin eyes. But also the hashed password that is transferred to the server could allow a replay attack. So **make sure your 4Minitz Server is only reachable via SSL**!!! This is also a good idea to protect all other data content from curious eyes.   

#### MongoDB security
If your MongoSB server is on the same machine as the 4Minitz server backend and you protected access to this server (firewall, no public logins), then maybe you are happy without adding credentials to MongoDB and without securing MongoDB via SSL.

In all other cases: Hints for a secure operation of your MongoDB server are explained in the chapter [Installation of MongoDB](#installation-of-mongodb)

See also: https://docs.mongodb.com/manual/tutorial/configure-ssl/
```
mongod --sslMode requireSSL --sslPEMKeyFile <pem> --sslCAFile <ca>
```
