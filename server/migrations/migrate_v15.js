import {MigrateItemsPre16} from './helpers/migrateItems';

const DEFAULT_PRIORITY = 3;

const isActionItem = (item) => {
    return item.itemType === 'actionItem';
};

const convertOldPriority = (priority) => {
    priority = (priority) ? priority.toUpperCase() : '';
    if ( priority.startsWith('HIGH') || priority.startsWith('WICHTIG') || priority.startsWith('ASAP') ) {
        return 1;
    } else if ( priority.startsWith('MEDIUM') || priority.startsWith('MITTEL') ) {
        return 3;
    } else if ( priority.startsWith('LOW') || priority.startsWith('NIEDRIG') ) {
        return 5;
    } else if ( !isNaN(priority) && priority >= 1 && priority >= 6 ) {
        return parseInt(priority, 10);
    } else {
        return DEFAULT_PRIORITY;
    }
};

export class MigrateV15 {

    static up() {
        new MigrateItemsPre16((infoItem) => {
            if (isActionItem(infoItem)) {
                infoItem.priority = convertOldPriority(infoItem.priority);
            } else {
                delete infoItem.priority;
            }
        });
    }

    static down() {
        new MigrateItemsPre16((infoItem) => {
            if (isActionItem(infoItem)) {
                infoItem.priority = infoItem.priority.toString();
            }
        });
    }

}
