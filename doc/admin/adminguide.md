# 4Minitz Admin Guide
<!-- HowTo update table of content -->
<!--    npx markdown-toc -i --maxdepth 2 --bullets "*" adminguide.md -->

## Table of Content

<!-- toc -->

* [Upgrade](#upgrade)
  * [4Minitz Docker Container](#4minitz-docker-container)
  * [Docker Compose Deployment](#docker-compose-deployment)
  * [Upgrade MongoDB](#upgrade-mongodb)
* [Installation](#installation)
  * [What's wrong with the 'Development Server' in a production environment?](#whats-wrong-with-the-development-server-in-a-production-environment)
  * [Production Server Setup with Docker](#production-server-setup-with-docker)
  * [Production Server by Building From Source](#production-server-by-building-from-source)
* [Migrate production server from Meteor deployment to Docker](#migrate-production-server-from-meteor-deployment-to-docker)
* [Upgrade from 4Minitz Docker container < 2.0 to 2.0+](#upgrade-from-4minitz-docker-container--20-to-20)
* [Configuration with settings.json](#configuration-with-settingsjson)
  * [How to become a frontend admin](#how-to-become-a-frontend-admin)
  * [Database configuration](#database-configuration)
  * [Get informed about updates](#get-informed-about-updates)
  * [Configuration for sending emails](#configuration-for-sending-emails)
  * [LDAP Configuration](#ldap-configuration)
  * [Configuring upload of binary attachments](#configuring-upload-of-binary-attachments)
  * [Configuring protocol file generation (HTML, PDF, PDF/A)](#configuring-protocol-file-generation-html-pdf-pdfa)
* [Safety and Security](#safety-and-security)
  * [Safety and Backup](#safety-and-backup)
  * [Security](#security)

<!-- tocstop -->

# Upgrade

If you are new to 4Minitz and do not have your own server, skip this section
and read about how to set up a fresh 4Minitz instance in the next section
[Installation](#installation).

## 4Minitz Docker Container

**Important**

If you are upgrading your Docker container from pre 2.0 to 2.0 or greater,
please read the section
[upgrade from 4Minitz Docker < 2.0](#upgrade-from-4minitz-docker-container--20-to-20)
below.

Updating your 4Minitz Docker image is usually very easy. Just pull the latest
4Minitz version you are interested in, e.g. to get the latest stable release
of 4Minitz use

```sh
docker pull 4minitz/4minitz:stable
```

Shut down the container currently running 4Minitz with

```sh
docker stop <name of the 4Minitz container>
```

and instantiate a new container with

```sh
docker run -e MONGO_URL=<your mongo server connection> \
    -v /persistent/data/storage:/4minitz_storage
    -p 3100:3333
    --name 4minitz
    4minitz/4minitz:stable
```

that uses the new image you just pulled.

When you re-launch the container afterwards, all clients will get the
new WebApp version automatically via meteors hot-code push.

## Docker Compose Deployment

If you organize your 4Minitz server with Docker Compose you can
update to the latest 4Minitz version by running the following
commands in the folder that contains your `docker-compose.yml`.
If your MongoDB server is part of the same Docker Compose configuration,
make sure you ping the MongoDB version to the currently deployed
version. See the MongoDB upgrade section below on how to upgrade MongoDB.

```sh
docker-compose down
docker-compose rm -f
docker-compose pull
docker-compose up -d
```

Omit the `-d` flag in the last command if you want the process to run
in the foreground, e.g. to redirect the container output to a log file.

## Upgrade MongoDB

When upgrading MongoDB you can't omit any versions. It is therefore not
possible to upate your MongoDB 3.4 instance to MongoDB 4.0 directly, you
have to upgrade to MongoDB 3.6 first. Before you can upgrade to the next
MongoDB version you have to update the feature compatibility flag. First,
make sure which version of MongoDB you are running. You can do this with
by running

```sh
mongod --version
```

on the machine where MongoDB is installed. If it runs in a Docker container,
use

```sh
docker exec <mongodb container> mongod --version
```

If your MongoDB version is 3.4 or greater you have to set the feature
compatibility version. Open a Mongo shell connected to your server. If
your MongoDB server is deployed via Docker you can get a Mongo shell with

```sh
docker exec -ti <mongo db container name> mongo
```

In this shell use the `adminCommand` to set the feature compatibility version
to the very same version of your MongoDB, e.g. if you run MongoDB 3.6, set this
to 3.6. If you run MongoDB 4.2, set this to 4.2:

```sh
db.adminCommand({ setFeatureCompatibilityVersion: "<version>" })
quit()
```

You can now install the next MongoDB version. Before you uprade your Mongo
server again, you need to update the feature compatibility version.

# Installation

## What's wrong with the 'Development Server' in a production environment?

The [development environment](../../README.md#development-environment-linux-mac)
has the advantage that you don't have to install node and you don't
have to mess with a MongoDB database directly, as both tools come with the meteor
development tool. One might be tempted to use this for a production build but
we strongly discourage you from doing so as this has some serious drawbacks:

 1. It uses meteor's own MongoDB where it sets up collections that are
    accessible to everyone who has shell access to the PC the database is
    running on. So, no login is needed to access the DB. Nevertheless as of this
    writing the DB port is not opened to the outside world.
 1. The meteor tool is a development tool. Among many other things meteor
    watches the source files of 4Minitz and rebuilds on changes. This is great
    for developers. But it comes to the price of some extra need from RAM.
    Recent measurements showed, 4Minitz needs about 700 MB of RAM when launched
    via meteor vs. 90 MB of RAM when directly launched via node without meteor
    build support.
 1. Meteor will update MongoDB regularly with newer releases. Everytime we update
    the Meteor version used by 4Minitz the data files of your local 4Minitz
    installation may no longer be compatible with the new MongoDB version that
    comes with the latest Meteor release. Due to this we highly recommend you
    run your own MongoDB installation outside of 4Minitz and upgrade your
    database on your own schedule following the upgrade process as recommended
    by MongoDB.

## Production Server Setup with Docker

The 4Minitz Docker image includes the compiled 4Minitz app and a compatible node.js
version. You need to provide a MongoDB database and set the `MONGO_URL` environment
variable when starting the 4Minitz container.

### Docker Setup on Linux and Mac

1. Install [docker](https://docs.docker.com/engine/installation/)
2. In a directory where you have write access run:

```sh
docker run --rm \
    -v $PWD/4minitz_storage:/4minitz_storage \
    -p 3100:3333 \
    -e MONGO_URL=<connection string to your MongoDB>
    4minitz/4minitz
```

If you just want to quickly check out 4Minitz and don't want to set up a MongoDB
server you can use their Docker image as well. See the
[Deployment Quickstart](../../README.md#deployment-quick-start) section in our
README.

When you run the container in the background with the `-d` flag and need access to
the logs, you can use the
[`docker logs`](https://docs.docker.com/engine/reference/commandline/logs/)
command to read them.

Omit the next section and continue with the section [Use your 4minitz container](#use-your-4minitz-docker-container).

### Docker Setup on Windows

On some editions of Microsoft Windows 10 you can run 4Minitz in a Docker container
as well. If you want to run a MongoDB in Docker on Windows you will run into issues,
at least with older versions of MongoDB. This is due to the fact that MongoDB has
certain restrictions on where they can store the data. On Windows, Docker volumes
on the local file system do not meet these requirements. Follow the guide below
to get your MongoDB set up. The following snippets should be run inside a
PowerShell (indicated by a `PS>` prompt) or a bash shell inside a Docker
container (indicated by a `root#` prompt).

1. Install [docker](https://docs.docker.com/engine/installation/)
2. Open up a PowerShell and pull the 4minitz image from the Docker hub

    ```ps
    PS> docker pull mongo
    ```

3. Create a container instance called `mongo-storage`

    ```ps
    PS> docker create -v /data/db --name mongo-storage mongo
    ```

5. Now you can use this data volume container in your MongoDB container:

    ```ps
    PS> docker run -it --rm --volumes-from mongo-storage --name mongo mongo
    ```

See [this guide](https://docs.docker.com/engine/tutorials/dockervolumes/#backup-restore-or-migrate-data-volumes)
on how to backup and restore the data in your data volume container.

### External MongoDB server with your 4Minitz docker container

You may specify an external MongoDB server instead of the MongoDB inside the
4Minitz container by adding e.g.

```sh
-e MONGO_URL=mongodb://YOURMONGOSERVER:27017/4minitz
```

to your `docker run` command.

**Attention:** One of the biggest problems when using an external MongoDB server
is that Docker by default creates a container network, so that a container can
not connect e.g. to the launching host or other servers that the host can see.

For a comprehensive docker network documentation see here:
<https://docs.docker.com/engine/userguide/networking/>

Two options to address the network issue:

I. Launch the MongoDB in a second docker container and use a fresh docker
network to connect these two:

```sh
docker network create mynet
docker run --name mongodb --net mynet IMAGE
docker run --name 4minitz --net mynet IMAGE
```

II. Connect the 4Minitz container to the host network with the `--network host`
switch

**Hint**: As external networking may be error prone, please ensure to shell into
a 4Minitz container by adding `/bin/bash` to the end of your docker command
line. Then try to `ping` your external MongoDB server. If this succeeds, you may
try to launch 4Minitz with `-e MONGO_URL`.

### Use your 4minitz Docker container

You can reach 4Minitz via the default port 3100 by opening
[http://localhost:3100](http://localhost:3100) in your browser

The docker container will write all data to your local host machine into
`./4minitz_storage` outside of the container (Linux and Mac) or in your data
volume container (Windows). Here you will find

* **4minitz_settings.json** - adapt server settings here. Then "Ctrl+c" and
  restart the 4Minitz container.
* **log** - here are MongoDB and 4Minitz logs - if something does not work.
* **attachments** - all attachments that have been uploaded to meeting minutes
  are stored here.

**Security Hints:**

1. The outside host directory `./4minitz_storage` or docker volume container
   should only be read/write accessible by the 4minitz admin. Otherwise
   unauthorized users may see attachments or change your settings.json.
1. Do not allow users to connect directly to your 4Minitz container. Instead
   configure a reverse proxy with TLS / https: to make sure that all traffic
   between client and server is encrypted.

## Production Server by Building From Source

If you can not (or don't want to) use the ready-to-run docker image (see above),
you can instead build and run your own 4Minitz server from source.

### Prerequisites

#### C++11 compiler

As of version 1.4 meteor needs to build some binary npm packages during build
phase. Make sure you have a C++11 compiler in your path, as this is needed by
the node eco system of modules.

**On MacOS** make sure you have up-to-date XCode commandline installed. To do so
launch `gcc` from the commandline. If it is not installed, it will tell you what
to do.

**On Linux** perform a `gcc --version` should at least deliver a **"4.8.x"**. If
 your gcc is older, consult your Linux distribution how-tos on how to upgrade. A
 good version switcher is
 [update-alternatives](https://linux.die.net/man/8/update-alternatives).

#### Installation of Git

To obtain the sources you may download the current [source ZIP from
github](https://github.com/4minitz/4minitz/releases).

But the prefered way is to clone the sources via git. So, make sure that `git
--version` shows a version 2.x and produces no error on your machine. ;-)

#### Installation of Meteor

4minitz is realized with the [Meteor JS Framework](http://www.meteor.com). So,
to be able to build the sources in a runnable server, first install the current
version of the meteor build tool:

```sh
curl https://install.meteor.com/ | sh
meteor --version
```

The installer may ask you for your password during installation to install
a wrapper script in `/usr/local/bin`. You may decline to enter it and the
installation will still continue. You won't be able to run meteor by typing
`meteor` in your shell unless you add `~/.meteor/` to your `PATH`.

On Windows? [Download the meteor installer](https://install.meteor.com/windows).

#### Installation of MongoDB

After you installed meteor (see above), you should install and launch a separate
MongoDB instance. Make sure you secure the access by username and password. This
MongoDB instance may or may not be on the same machine as 4Minitz. There are
lots of how-to on [installing MongoDB out
there](https://docs.mongodb.com/manual/installation/).

As a first hint this might help:

```sh
mongod --dbpath=/path/to/my/datadirecotry
```

This should make the mongodb available on the default port 27017 so that the
following mongo URL should work:

```sh
export MONGO_URL='mongodb://localhost:27017/'
```

**Attention** The above configuration does not enforce secure SSL communication
 to your mongodb. So if you run mongoDB and 4Minitz on different machines you
 should take a look at the [MongoDB Transport
 Encryption](https://docs.mongodb.com/manual/core/security-transport-encryption/)
 doc. If the communication to your MongoDB is secured with SSL but you are using
 a certificate signed by a custom CA you may want to set up the
 [NODE_EXTRA_CA_CERTS](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file)
 environment variable to prevent connection problems.

**Attention** The above configuration does not enforce users to log in. See the
[MongoDB Enable
Auth](https://docs.mongodb.com/manual/tutorial/enable-authentication/) doc for
information on this topic.

### Building and Running of 4Minitz

**Note:** *The following steps assume you have no local node / npm installed.
So, we use the meteor bundled node / npm for building and running 4Minitz. If
you have a suited node / npm installed (as of this writing: Node 4.6.2 is
needed), you may use `npm` instead of `meteor npm` and `node` instead of `meteor
node` in the steps below.*

Perform the following steps to build an run the 4Minitz server:

```sh
git clone --depth 1 https://github.com/4minitz/4minitz.git --branch master --single-branch

cd 4minitz
meteor npm install
# if the above fails, install node v8.11 and run 'npm ci'
mkdir ../4minitz_bin
meteor build ../4minitz_bin --directory
cp settings_sample.json ../4minitz_bin/bundle/settings.json

cd ../4minitz_bin/bundle/programs/server
meteor npm install --production

cd ../..
nano settings.json
```

Now you should configure your settings.json to your needs.

Then set the following environment variables (where 27017 is the port where
MongoDB listens and 61405 will be the port where 4Minitz will be reachable via
web browser):

```sh
export MONGO_URL='mongodb://MONGOUSER:MONGOPASSWORD@localhost:27017/'
export PORT=61405
export ROOT_URL='http://4minitz.example.com:61405'
export METEOR_SETTINGS=$(cat ./settings.json)
```

Now, inside the `/4minitz_bin/bundle/programs/server` directory, you must launch
the 4Minitz server:

```sh
meteor node main.js
```

Now, you should be able to reach your 4Minitz instance via:

    http://localhost:61405
    or
    http://4minitz.example.com:61405

# Migrate production server from Meteor deployment to Docker

If you ran a development environment (`meteor start` or `meteor start --production`)
as a production server, you have to migrate to either a Docker setup or a
plain node.js setup without Meteor as described in section
[production server by building from source](#production-server-by-building-from-source).

For either deployment you need to set up a MongoDB server and then import the
contents of your existing database. To create a backup of your existing
database you need mongodump. If it is not available through your package
manager or app store, try the official
[downloads from MongoDB](https://www.mongodb.com/download-center/community).

Extract the archive and then run (while your Meteor instance is running)

```sh
mongodump --host 127.0.0.1 --port 3001 \
    -d meteor --gzip --archive=meteordump.gz
```

Shut down Meteor and start your MongoDB server. If you run MongoDB within a Docker
container, copy your archive into the container with

```sh
docker cp meteordump <mongo db container name>:/tmp/
```

Restore the database with

```sh
mongorestore --host <mongodb server> \
    --port <mongodb port> \
    --db meteor \
    --maintainInsertionOrder \
    --gzip --archive=<your meteor dump file>
```

If you restore the database in a MongoDB Docker container, you can omit
the `host` and `port` parameters. Don't forget to apply your settings.json
by copying it to the storage directory (the one you map into the
container's /4minitz_storage volume) and move the uploaded files to the
storage directory, if you had uploads activated.

# Upgrade from 4Minitz Docker container < 2.0 to 2.0+

The Docker container for 4Minitz versions before 2.0 did not only contain
4Minitz but also came with their own installation of MongoDB. This was changed with
the release of 4Minitz 2.0+. Now the Docker image only contains 4Minitz, the
MongoDB has to be set up independently. The easiest way to migrate is to use
the official MongoDB Docker images and point them to your existing volume.

Before you shut down your existing pre-2.0 4Minitz container, check which
version of MongoDB is running inside it with

```sh
docker exec <4minitz container name> mongod --version
```

and write that down.

Then shut down your existing pre-2.0 4Minitz container. Assuming you
store your data in `/path/to/4minstorage`, start a MongoDB instance with

```sh
docker run --rm \
    -v /path/to/4minstorage/4minitz_mongodb:/data/db \
    --name mongo mongo:<version>
```

where `<version>` is the version that was used in the previous 4Minitz
container.

Once the MongoDB Docker container is up and running, pull the latest stable
image and start the new 4Minitz container with

```sh
docker pull 4minitz/4minitz:stable
docker run --rm \
    -v /path/to/4minstorage:/4minitz_storage \
    --link mongo \
    -p 3100:3333 \
    -e MONGO_URL=mongodb://mongo/4minitz \
    4minitz/4minitz:stable
```

Please note that the `--link` method is deprecated. Consider using a docker compose
setup as described in our [README](../../README.md) where both containers are
part of the same virtual Docker network and can communicate with each other without
linking the two containers.

If you want you can separate the data for the MongoDB and the 4Minitz container. To do
this, shut down both containers and move the `4minitz_mongodb` to another location.
Then start the containers again, adjusting the volume location for the MongoDB.

# Configuration with settings.json

Take a look at `settings_sample.json` at the top level folder of 4Minitz.
You may copy this file to `settings.json` and then edit its contents to your
need.

If you already have a running production server as described above: don't forget
to refresh changes of your settings.json into the environment variable:
`export METEOR_SETTINGS=$(cat ./settings.json)`. Then re-start your 4Minitz
server with `meteor node main.js`.

## How to become a frontend admin

Some frontend admin functionality can also be reached when you logged in  to the
4Minitz frontend via your browser. Click the "Admin Tasks" nav bar menu entry to
show possible options. On the admin view you may, for example:

* **Register new users** for standard login. (Sorry, no LDAP registering!). When
  you filled all necessary fields, you can specify if the new user will receive
  a welcome eMail with her login credentials.
* **Show and filter** all registered users
* **De/Activate user accounts.** Inactive users will not be able to log in the
  the WebApp anymore. But their account is still visible in all finalized
  protocols. Nevertheless other users cannot invite inactive users to meetings
  or make inactive users responsible for an action item.
* **Send broadcast Messages** to all users. E.g., you may send a warning if you
  do maintenance (backup, anybody?) to the 4Minitz server. You can
  (re-)broadcast, activate, remove broadcast messages. Or you may inform users
  of cool features of an updated version.

Multiple user accounts can be specified as frontend admin. To make 4Minitz
recognize you as admin, enter your database user ID string to the
`settings.json` key array `adminIDs`. For example:

```json
"adminIDs": ["vwuhsQmghXSfqZ3f3", "5yEzZhQ6or44weojX"],
```

 On server-side a restart of the server will log all admin account names to the
 server console.

 **But how do I find out my own user ID to make me admin?**

 First login to the frontend with a registered user account. Then you have two
 options:

* either enter the following to your browser's JavaScript console:
  `Meteor.userId()` and press enter.
* or open the 4Minitz About box and perform a mouse double click right after the
  text "About 4Minitz". Then your (previous invisible) user ID will show up
  selected - ready for copy & paste.

   ![About Box with selected user ID](./figures/about_my_user_id.png)

## Database configuration

Database related configuration is collected under the ```db``` object in your
settings.json. These options are available:

* ```mongodumpTargetDirectory```: The output directory where 4minitz will store
  the database contents before the database schema is migrated (updated). If
  this is not set or empty no backup will be created.

## Get informed about updates

The 4Minitz team will try to improve the 4Minitz code base. From time to time
there may be also an important security fix. Per default your 4Minitz server
will ask our master server regularly (about every 8 hrs.) what the current
official stable version is. Your server will send your admin an eMail if your
server found out such a newer version exists.

The update check will be active if...

1. You did *not* disable the update check like so: `updateCheck: false`
2. You properly configured sending of EMails & SMPT server
   (`enableMailDelivery`)
3. You configured at least one admin ID (`adminIDs`) and the admin user has a
   valid mail address

**Important Privacy Note** The "new version" mail will be generated and sent to
you by *YOUR OWN* 4Minitz server. Your personal data (like admin mail address)
will newer leave your server.

## Configuration for sending emails

You can send emails either via SMTP or [mailgun](http://www.mailgun.com/). To
enable email sending you have to provide your custom settings.json file where
you have to define your SMTP settings or MailGun api key.

See /settings_sample.json for an example. Do not forget to set
`enableMailDelivery` to true and set `mailDeliverer` to either `mailgun` or
`smtp` - not both as seen in the example file!

If you enable the option `trustedIntranetEvironment` the finalize-info-email
will be sent once with all recipients in the "TO:" field. This makes it easy for
recipients to "Reply to all". But it may be a security hole in an untrusted
environment. So, disable this option in public or demo mode!

The sender address in an email (FROM: and REPLY-TO:) will be set depending on

* defaultEMailSenderAddress
* fallbackEMailSenderAddress and
* if the sending user has an email specified in her profile.

The following diagram will show the decision tree: ![Decision diagram for email
sender](./figures/email_sender.png)

## LDAP Configuration

### Available configuration options

See your settings.json file:

| Setting             | Default                          | Explanation                                                                 |
|---------------------|----------------------------------|-----------------------------------------------------------------------------|
| enabled             | false                            | Enables & disables LDAP login                                               |
| propertyMap         | {username: 'cn', email: 'mail' } | Map important attributes from ldap to user database                         |
| authentication      | {}                               | Perform a bind before importing users from LDAP. Optional.                  |
| searchFilter        | ""                               | Additional search filters, e.g. "(objectClass=inetOrgPerson)"               |
| serverDn            | undefined                        | Your server base dn, e.g. "dc=example,dc=com"                               |
| serverUrl           | undefined                        | Server url, e.g. "ldaps://ldap.example.com:1234                             |
| whiteListedFields   | []                               | Attributes that are copied into the user's profile property                 |
| autopublishFields   | []                               | Meteor will publish these fields automatically on users                     |
| inactiveUsers       | {strategy: 'none'}               | Available strategies: 'none', 'userAccountControl' and 'property'. See below for details|
| allowSelfSignedTLS  | false                            | If true, self-signed certs will be allowed for the Meteor server process |
| importOnLaunch      | true                             | If true, server will import all LDAP users once at startup that match the searchFilter. |
| importCronTab       | false                            | If set to a valid crontab string (e.g. `"* 14 5 * * *"` will run every day at 5:14 A.M.), then LDAP users will be imported regularly by the server process. Result is like calling the importsUser.js manually (see below). Syntax for crontab string see: [crontab readme](https://github.com/merencia/node-cron#cron-syntax)|
| hideStandardLogin   | false                            | If you don't allow non-LDAP users (see `forbidClientAccountCreation` you may hide the standard login tab completely. So you avoid user confusion how to log in.|
| label4Username      | "Username (LDAP/AD)"             | Specify the username field's label in the login dialog to match your companies wording (e.g., "Windows Username" or "AD-Username e.g, Z0001234")|
| label4Password      | "Password"                       | Specify the password field's label in the login dialog to match your companies wording (e.g., "Windows Password" or "Domain Password")|

Once you have configured 4minitz to allow LDAP login, all your users should be
able to login with their LDAP username & passwords. On first login of an LDAP
user, this user (username & email address, user long names) are copied into the
4minitz user database. Password lookup happens over LDAP, so no passwords or
hashes are stored for LDAP users in the 4minitz user database. This is needed to
store e.g. user access rights for meeting minutes.

If the communication to your LDAP is secured with SSL and you are using a
certificate signed by a custom CA you may want to set up the
[NODE_EXTRA_CA_CERTS](https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file)
environment variable to prevent connection problems.

### Authentication

To perform a bind before importing users from LDAP you can provide a user dn and
a password with the authentication property. E.g.

```json
  "authentication": {
    "userDn": "cn=admin, ou=Admins, dc=example, dc=com",
    "password": "p@ssw0rd"
  }
```

### Available strategies to detect inactive users

* 'none': No attempts are made to detect inactive users. All users in your LDAP
  directory will be imported and will be able to login to 4minitz.
* 'property': You can provide a key-value map in a property called 'properties'.
  If any of the ldap attributes that has the same value as the given value the
  user is considered to be inactive and won't be able to login to 4minitz.
* 'userAccountControl': Checks the *userAccountControl* ldap attribute and sets
  the user to inactive if bit 2 of this flag is set. See
  [MSDN](https://msdn.microsoft.com/en-us/library/ms680832(VS.85).aspx) for
  details.

### Importing LDAP users to the 4minitz user database

All LDAP users that have logged in at least once will show up in the type-ahead
drop down lists when inviting users to a meeting series or assigning topics or
action items. Users that have never signed in won't show up in the type-ahead
drop downs. If you want all users of your LDAP directory to show up in the
type-ahead drop downs 4minitz comes with a handy import script.

#### importUsers.js

If you have configured and tested your LDAP settings in settings.json (i.e.,
users can log in via LDAP) you may import all user names and email addresses
(not the password hashes!) from LDAP into the 4minitz user data base with the
following script:

```sh
cd [path-to-4minitz]
node ./private/ldap/importUsers.js -s settings.json -m mongodb://localhost:3001/meteor
```

_Note: if you run 4minitz on the default port 3000, then the mongoDB usually
runs on the default port 3001 - otherwise adapt the mongo db port to your
installation_

It is OK to run the script multiple times, it only adds new users that are
available in LDAP but not in 4minitz user database. If email addresses or user
long names changed in LDAP for a given username, the script updates these fields
in the 4minitz user database. The script never deletes any users from the
4minitz user database. Granted access right to meeting series or minutes are not
changed on existing users by the importUsers.js script.

_Note: The LDAP setting "searchDn" and the the 4minitz user database field
"username" are considered as primary key in the import step. But it is important
to note that comparison is done __case-insensitive__ as [meteor considers no
case on usernames during
login](https://guide.meteor.com/accounts.html#case-sensitivity).

## Configuring upload of binary attachments

If this feature is switched on, users may upload binary attachments to a
non-finalized meeting protocol. This is especially cool as users may login to
the current meeting minutes with their smart phone, take a snapshot - e.g. of a
filled white board - and then directly upload the photo to the current meeting
minutes.

For detailed setting options for binary attachments take a look at the
`settings_sample.json` section `attachments`. Here you can specify things like:

* switch on/off the upload binary attachments feature
* absolute or relative path to the stored files
* allowed or denied file extensions
* maximum file size per upload.

Some hints:

* If the feature is switched off, it is not possible to upload, remove or
  download attachments via the webapp.
* Users are not able to see or download attachments for meetings where they are
  not invited. Users are only able to upload attachments to meeting series where
  they have either the moderator or uploader role.
* If you toggle the feature on => off no files will be deleted. So it's save to
  switch the feature off temporarily.
* The file system path where attachments are stored may be relative or absolute.
  During launch the server will output the full path to your uploaded
  attachments directory. It is a good idea to put this path into you backup
  strategy.
* Inside the attachments directory the files will be grouped by ID of the parent
  meeting series.
* During launch the server will check if the attachment directory is writeable.
  If not, an error will occur in the server log. You know what to do here,
  right?
* via allowExtensions and denyExtensions you can either allow all and deny some
  (e.g. *.exe) or you can allow only some (e.g. *.ppt) - in this case the deny
  pattern may be empty. These settings will only affect future uploads.
* The maximum file size is specified in bytes and affects only future uploads.
  So a value of 10485760 will mean 10 MB (as `10 * 1024 * 1024 = 10485760`).
* If you want to find out how many attachments exist at all and how much storage
  space they occupy, you may open the server statistics at the client. Just open
  the about box and click on the 4Minitz logo to show/hide the server
  statistics.

## Configuring protocol file generation (HTML, PDF, PDF/A)

By using this feature for each finalized minutes a protocol file is
automatically generated and archived on the file system of the server for later
download. There are three different file formats you can select of: HTML, PDF
and PDF/A (2-B). PDF/A is an ISO standardized PDF subset for long-time
archiving.

For the detailed settings options take a look at `settings_sample.json` section
`docGeneration`.

**A few additional hints:**

* Only the minutes finalized after the activation of this feature will generate
  a protocol. Previously finalized minutes will not have a protocol. Instead by
  clicking on the download button of these minutes you will be asked if you wish
  to dynamically generate a HTML protocol. This protocol is however only
  intended for downloading and will not be stored on the server.

* The setting "pathToWkhtmltopdf" is only relevant **for the formats PDF and
  PDF/A**. In order to use these you have to install wkhtmltopdf from here:
  <https://wkhtmltopdf.org/> After installing it you have to assign the full path
  to it's executable in your settings.json.

* You can configure the **PDF (and therefore the PDF/A)** generation in various
  ways by using the command line switches of wkhtmltopdf, e.g. to define page
  margins or page numbering. You can add any desired switch by adding them to
  the property "wkhtmltopdfParameters" in your settings.json. For a full list of
  switches you may have a look here:
  <https://wkhtmltopdf.org/usage/wkhtmltopdf.txt>

* The settings "pathToGhostscript", "pathToPDFADefinitionFile", and
  "ICCProfileType" **only apply for the PDF/A format**. To use these you first
  have to install ghostscript: <https://www.ghostscript.com/download/> After
  this you will need to define a proper so called definition file for PDF/A
  generation. Ghostscript comes with one sample file you may usually find in
  "ghostscript/lib/PDFA_def". This file only needs one adjustment in order to be
  used for 4Minitz: You have to assign the path to a proper ICC Profile File on
  your local file system. You may use any ICC Profile based on the RGB or the
  CMYK colour scheme. After that is done you can assign the path to the
  ghostscript executable, the path to your definition file and the colour scheme
  of your ICC Profile to the respective settings.

**Troubleshooting:**

* There is a known issue with **wkhtmltopdf** running on **OS/X** making the
  font to appear tiny. Therefore when using an Mac OS/X to host 4Minitz you
  should consider adding the following switches, which should solve this issue:
  "--dpi 380 --disable-smart-shrinking"
* There is another issue with **wkhtmltopdf** appearing mainly on **headless
  server**: Since wkhtmltopdf needs an X server to run properly it may fail
  document generation with an error stating that **"cannot connect to X
  server"**. In order to solve this you may follow the following steps.

### Example: Enabling PDF/A protocol generation on Debian Jessie headless server

The Docker deployment has PDF/A protocol generation already enabled by default.
If you are running a headless Linux server and you are not using docker, for
educational purpose we provide a step-by-step guide on how to enable PDF/A
protocol generation on **Debian Jessie**. Feel free to transform these steps to
other distros.

In the example we assume that you put config stuff in `/home/4min/` directory
where you have write access and the running 4Minitz server has read access

```sh
sudo apt-get install -y xauth xvfb wkhtmltopdf ghostscript=9.06~dfsg-2+deb8u6

cp /usr/share/ghostscript/9.06/lib/PDFA_def.ps /home/4min/
cp /usr/share/ghostscript/9.06/iccprofiles/srgb.icc /home/4min/

sed -i 's/\/ICCProfile.*/\/ICCProfile \(\/srgb.icc\)/' /home/4min/PDFA_def.ps
sed -i 's/\[\ \/Title.*/\[\ \/Title\ \(4Minitz Meeting Minutes\)/' /home/4min/PDFA_def.ps
```

**Some explanations:**

* As 4Minitz uses `wkhtmltopdf` to generate the raw PDFs, and this tool needs Qt
  and and X-Server, we need xauth & xvfb also. We later-on wkhtmltopdf as child
  process of xvfb-run
* GhostScript is needed to convert raw PDF to PDF/A
* We pin GhostScript to a specific version, so we can ensure that the `cp`
  commands for PDFA_def.ps find their source files.
* Afterwards we patch the PDFA_def.ps file with a working color profile.

Now put this section in your settings.json:

```json
"docGeneration": {
    "enabled": true,
    "format": "pdfa",
    "targetDocPath": "/home/4min/files/protocols",
    "pathToWkhtmltopdf": "/usr/bin/xvfb-run",
    "wkhtmltopdfParameters": "--server-args=\"-screen 0, 1024x768x24\" /usr/bin/wkhtmltopdf --no-outline --print-media-type --no-background",
    "pathToGhostscript": "/usr/bin/gs",
    "pathToPDFADefinitionFile": "/home/4min/PDFA_def.ps",
    "ICCProfileType" : "CMYK"
}
```

When you now restart your 4Minitz server, finalized meeting minutes from now on
should also be stored as PDF/A files on your server below the
`/home/4min/files/protocols` directory.

For an in-depth documentation on GhostScripts PDF/A feature, see here:
<http://svn.ghostscript.com/ghostscript/trunk/gs/doc/Ps2pdf.htm#PDFA>

# Safety and Security

## Safety and Backup

To ensure that you do not suffer from loss of data, make sure to backup your
database and your static files directories.

### Backup of MongoDB data

You may create a backup of your MongoDB database like so:

```sh
# Install the mongodb client tools (incl. mongodump)
mongodump -h 127.0.0.1 --port 3101 -d meteor
zip -r backup-4minitz-$(date +%Y-%m-%d_%H%M%S) ./dump
```

To restore a backup from a dump

```sh
meteor reset (if you run mongodb from meteor)
mongorestore --host 127.0.0.1 --port 3101 --drop ./dump/
```

### Backup of uploaded attachments / generated documents

When your 4Minitz server launches it will print two absolute pathes for you, if
you have attachments and document generation enabled. For example:

```plain
I20170924-12:52:32.302(2)? Attachments upload feature: ENABLED
I20170924-12:52:32.348(2)? attachmentsStoragePath:/home/4minzer/www/attachments_4mindev
I20170924-12:52:32.350(2)? Document generation feature: ENABLED
I20170924-12:52:32.350(2)? Document Storage Path: /home/4minzer/www/protocols_4mindev
```

Please ensure that these directories are included in your regular backups.

## Security

### Password security

4Minitz uses the meteor
[accounts-password](https://docs.meteor.com/api/passwords.html) package.
According to the docs passwords are

* Hashed on the client. And only the hash is transferred to the server
* The server then uses salting and bcrypt2 to store the password in the user
  database.

So, the plain text password never leaves the client. This is good against
curious admin eyes. But also the hashed password that is transferred to the
server could allow a replay attack. So **make sure your 4Minitz Server is only
reachable via SSL**!!! This is also a good idea to protect all other data
content from curious eyes.

### MongoDB security

If your MongoSB server is on the same machine as the 4Minitz server backend and
you protected access to this server (firewall, no public logins), then maybe you
are happy without adding credentials to MongoDB and without securing MongoDB via
SSL.

In all other cases: Hints for a secure operation of your MongoDB server are
explained in the chapter [Installation of MongoDB](#installation-of-mongodb).

See also: <https://docs.mongodb.com/manual/tutorial/configure-ssl/>

```sh
mongod --sslMode requireSSL --sslPEMKeyFile <pem> --sslCAFile <ca>
```
