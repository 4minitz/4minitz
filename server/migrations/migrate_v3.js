import {MigrateItems} from './helpers/migrateItems';

// convert the participants fields
export class MigrateV3 {

    static up() {
        new MigrateItems((infoItem => {
            if (infoItem.isSticky === undefined) {
                infoItem.isSticky = false;
            }
            return infoItem;
        }));
    }

    static down() {
        new MigrateItems((infoItem) => {
            delete infoItem.isSticky;
        });
    }
}
