import { MinutesSchema } from '/imports/collections/minutes.schema';

// remove minutes.isUnfinalized
// add minutes.finalizedVersion
// add minutes.finalizedHistory
export class MigrateV9 {

    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            if (!minute.finalizedVersion) {
                minute.finalizedVersion = 0;
                if (minute.isFinalized) {
                    minute.finalizedVersion = 1;
                }
            }
            if (!minute.finalizedHistory) {
                minute.finalizedHistory = [];
            }

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $unset: { isUnfinalized: 0 },
                    $set: {
                        'finalizedVersion': minute.finalizedVersion,
                        'finalizedHistory': minute.finalizedHistory
                    }
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        // We switch off bypassCollection2 here to avoid useless schema exceptions
        MinutesSchema.getCollection().find().forEach(minute => {
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {
                        'isUnfinalized': ! minute.isFinalized
                    }
                },
                {bypassCollection2: true}
            );
        });
        // delete the participantsAdditional attribute from all minutes
        MinutesSchema.getCollection().update({},
            {$unset: { finalizedVersion: 0,
                finalizedHistory: 0}},
            {multi: true, bypassCollection2: true});
    }
}
