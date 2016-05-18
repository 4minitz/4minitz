import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from './mongoBackup';

import { MigrateV1 } from './migrate_v1'

// Example for defining a migration
 Migrations.add({
     version: 1,
     up() {
         MigrateV1.up();
     },
     down() {
         MigrateV1.down();
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

    if (currentVersion < latestVersion) {
        backupMongo(process.env.MONGO_URL);
        Migrations.migrateTo('latest');
    }
};