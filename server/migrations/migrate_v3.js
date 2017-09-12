import {MigrateItemsPre16} from './helpers/migrateItems';

// convert the participants fields
export class MigrateV3 {

    static up() {
        new MigrateItemsPre16((infoItem => {
            if (infoItem.isSticky === undefined) {
                infoItem.isSticky = false;
            }
            return infoItem;
        }));
    }

    static down() {
        new MigrateItemsPre16((infoItem) => {
            delete infoItem.isSticky;
        });
    }
}
