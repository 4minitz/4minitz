import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from './mongoBackup';

import { MigrateV1 } from './migrate_v1'

// Example for defining a migration
 Migrations.add({
     version: 1,
     up() {
         MigrateV1.up();

        //e.g.
        // MeetingSeries.find().forEach(series => {
        //   MeetingSeries.update(series._id, {$set: {newField: 1}});
        // });
     },
     down() {
         MigrateV1.down();

        // e.g.
        // MeetingSeries.update({}, {$unset: {newField: true}});
     }
 });

function findLatestVersion() {
    let max = 0;

    Migrations._list.forEach((entry) => {
        max = Math.max(entry.version, max);
    });

    return max;
}

export const handleMigration = function () {
    const latestVersion = findLatestVersion(),
        currentVersion = Migrations.getVersion();

    console.log("Current Version: " + currentVersion);
    console.log("Latest Version: " + latestVersion);

    if (currentVersion < latestVersion) {
        backupMongo(process.env.MONGO_URL);
        console.log("MIGRATE!!!");
        Migrations.migrateTo('latest');
    }
};