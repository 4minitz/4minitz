import { Migrations } from 'meteor/percolate:migrations';
import { backupMongo } from '../mongoBackup';
import { Meteor} from 'meteor/meteor';

import moment from 'moment/moment';
import path from 'path';

const LAST_MIGRATION = 21;

for (let i=1; i<=LAST_MIGRATION; i++) {
    const migration = require(`./migrate_v${i}`)[`MigrateV${i}`];
    Migrations.add({version: i, up() {migration.up();}, down() {migration.down();}});
}

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
