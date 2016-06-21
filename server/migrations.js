import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from './mongoBackup';

import { MigrateV1 } from './migrate_v1'
import { MigrateV2 } from './migrate_v2'
import { MigrateV3 } from './migrate_v3'
import { MigrateV4 } from './migrate_v4'
import { MigrateV5 } from './migrate_v5'
import { MigrateV6 } from './migrate_v6'

Migrations.add({version: 1, up() {MigrateV1.up();}, down() {MigrateV1.down();}});
Migrations.add({version: 2, up() {MigrateV2.up();}, down() {MigrateV2.down();}});
Migrations.add({version: 3, up() {MigrateV3.up();}, down() {MigrateV3.down();}});
Migrations.add({version: 4, up() {MigrateV4.up();}, down() {MigrateV4.down();}});
Migrations.add({version: 5, up() {MigrateV5.up();}, down() {MigrateV5.down();}});
Migrations.add({version: 6, up() {MigrateV6.up();}, down() {MigrateV6.down();}});

// ----------------------------------------------------------------
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
