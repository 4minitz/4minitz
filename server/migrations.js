import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from './mongo-backup';

Migrations.add({
    version: 1,
    up() {
        // e.g.
        // MeetingSeries.find().forEach(series => {
        //   MeetingSeries.update(series._id, {$set: {newField: 1}});
        // });
    },
    down() {
        // e.g.
        // MeetingSeries.update({}, {$unset: {newField: true}});
    }
});

function findLatestVersion() {
    let max = -1;

    Migrations._list.forEach((entry) => {
        max = Math.max(entry.version, max);
    });

    return max;
}

export const handleMigration = function () {
    const latestVersion = findLatestVersion(),
        currentVersion = Migrations.getVersion();

    if (currentVersion < latestVersion) {
        // uncomment this as soon as the first migration exists

        // backupMongo();
        //Migrations.migrateTo('latest');
    }
};