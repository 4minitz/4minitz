import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from '../mongoBackup';
import { Meteor} from 'meteor/meteor';

import moment from 'moment/moment';
import path from 'path';

import { MigrateV1 } from './migrate_v1'
import { MigrateV2 } from './migrate_v2'
import { MigrateV3 } from './migrate_v3'
import { MigrateV4 } from './migrate_v4'
import { MigrateV5 } from './migrate_v5'
import { MigrateV6 } from './migrate_v6'
import { MigrateV7 } from './migrate_v7'
import { MigrateV8 } from './migrate_v8'
import { MigrateV9 } from './migrate_v9'
import { MigrateV10 } from './migrate_v10'
import { MigrateV11 } from './migrate_v11'
import { MigrateV13 } from './migrate_v13'

Migrations.add({version: 1, up() {MigrateV1.up();}, down() {MigrateV1.down();}});
Migrations.add({version: 2, up() {MigrateV2.up();}, down() {MigrateV2.down();}});
Migrations.add({version: 3, up() {MigrateV3.up();}, down() {MigrateV3.down();}});
Migrations.add({version: 4, up() {MigrateV4.up();}, down() {MigrateV4.down();}});
Migrations.add({version: 5, up() {MigrateV5.up();}, down() {MigrateV5.down();}});
Migrations.add({version: 6, up() {MigrateV6.up();}, down() {MigrateV6.down();}});
Migrations.add({version: 7, up() {MigrateV7.up();}, down() {MigrateV7.down();}});
Migrations.add({version: 8, up() {MigrateV8.up();}, down() {MigrateV8.down();}});
Migrations.add({version: 9, up() {MigrateV9.up();}, down() {MigrateV9.down();}});
Migrations.add({version: 10, up() {MigrateV10.up();}, down() {MigrateV10.down();}});
Migrations.add({version: 11, up() {MigrateV11.up();}, down() {MigrateV11.down();}});
Migrations.add({version: 13, up() {MigrateV13.up();}, down() {MigrateV13.down();}});

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
        let basePath = Meteor.settings && Meteor.settings.db && Meteor.settings.db.mongodumpTargetDirectory || '';

        if (basePath !== '') {
            let backupPath = path.join(basePath, 'mongobackup_' + moment().format('YYYY-MM-DD'));
            backupMongo(process.env.MONGO_URL, backupPath);
        } else {
            console.warn('db.mongodumpTargetDirectory is not configured in settings.json. Skipping database backup!');
        }

        Migrations.migrateTo('latest');
    }
};
