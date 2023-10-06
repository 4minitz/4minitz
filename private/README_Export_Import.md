## Export & Import MeetingSeries

Disclaimer: these script is only runnable from source tree after npm install.
So currently not appropriate for docker deployments - sorry!

**Important:** Before you use the importer script, make a complete mongoDB backup with `mongodump` on the target (import) database!

**YOU HAVE BEEN WARNED!!**

#### Usecase
Sometimes an admin is in the situation that an existing meeting series
must be moved over to a different server. If the whole server has only one meeting series, one could work with `mongodump` & `mongorestore`.
But normally adminds face more than one meeting series on a server.

### The problem
Though 4Minitz uses a document based database, The information documents belonging to a meeting series are distributed over multiple collections. And users must have the appropriate rights/roles for the meeting series. Further: when moving from one server to another, the target server may already have the desired user accounts, but with different "database IDs". So it is not only necessary to copy over all information, but information must also be "patched" on the target server.

### Export HowTo
1. Determine your source/export MongoDB host and port.
1. Determine the meeting series ID. For example in this URL: `http://localhost:3100/meetingseries/fEn2eaLCiGDscjnrx` the meeting series ID is: `fEn2eaLCiGDscjnrx`
1. `cd private` in your 4minitz directory
1. `node ./exportMeetingSeries.js  -m mongodb://localhost:3101/meteor -i fEn2eaLCiGDscjnrx`
1. Do not forget to zip/copy all attachments & meeting protocols from the appropriate directories

The export script will create multiple files:
```
*** 4Minitz MeetingSeries Export Tool *** (made for schema version: 19)
DB Schema Version: 19
Saved: fEn2eaLCiGDscjnrx_schema.json
Saved: fEn2eaLCiGDscjnrx_meetingSeries.json
Saved: fEn2eaLCiGDscjnrx_minutes.json with 29 minutes
Saved: fEn2eaLCiGDscjnrx_topics.json with 23 topics
Saved: fEn2eaLCiGDscjnrx_filesAttachments.json with 1 file attachments
      *** Hint *** Please manually copy all files below:
      /home/wer/4min_uploads/attachments/fEn2eaLCiGDscjnrx
Saved: fEn2eaLCiGDscjnrx_filesDocuments.json with 7 protocol documents
      *** Hint *** Please manually copy all files below:
      /home/wer/4min_uploads/protocols/fEn2eaLCiGDscjnrx
Saved: fEn2eaLCiGDscjnrx_users.json with 14 users
Saved: fEn2eaLCiGDscjnrx_userMap.json
       *** IMPORTANT!!! EDIT USER MAP FILE BEFORE IMPORT!!!
```

### Import Preparation - Edit USERMAP file
Before you run the importer you should open the `xxxxxxxxxx__userMap.json` in your favorite editor. This json file lists on the left all user IDs from users that where referenced by your meeting series. Some may be found at older minutes as participants, some user IDs may be found as responsibles for topics or action items.

The map normally has key & value identical. This means, all of these users will be copied from the export DB to the import DB. This works for LDAP and normal users. Normal users will have the same login password in both servers.

Nevertheless, you can change the right side (value) of every user ID to map to a different - existing user ID in you import database. In this case the importer will find the existing user, give access rights for the new imported meeting series and will "patch" all minutes, topics, action items etc. with the new user ID.

### Do the Import

**FIRST PERFORM A BACKUP!! - SERIOUSLY!!**
1. Determine your target/import MongoDB host and port.
1. Use anexported meeting series ID, e.g. fEn2eaLCiGDscjnrx
1. `node importMeetingSeries.js  -m mongodb://localhost:1234/meteor -i fEn2eaLCiGDscjnrx`

You should see something like:
```
*** 4Minitz MeetingSeries Import Tool *** (made for schema version: 19)
DB Schema Version: 19
Found 14 users in fEn2eaLCiGDscjnrx_userMap.json
Found 2 target users in current user DB.
Will copy over 12 export users to current user DB.
OK, inserted meeting series with ID: fEn2eaLCiGDscjnrx
OK, inserted 29 meeting minutes.
OK, inserted 23 topics.
OK, inserted 1 attachments meta data.
OK, inserted 7 protocol files meta data.
```

### Troubleshooting
* The tool will check if the database schema version of source-DB, target-DB and exporter/importer tool match. The importer will refuse work if this is not hte case. Nevertheless you can enforce an import with `--force` switch. **Did we mention that a backup is a good idea?**

* If the importer script shows errors. This is probably due to a bad USERMAP file. You can change your USERMAP and re-run the importer script if you
   * Delete the already imported meeting series from DB
   * Delete the already copied user accounts.
