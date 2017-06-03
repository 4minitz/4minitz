import { MinutesSchema } from '/imports/collections/minutes.schema';

// convert the participants fields
export class MigrateV2 {

    static up() {
        MinutesSchema.getCollection().find().forEach(minute => {
            if (!minute.participants) {
                minute.participants = '';
            }

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesSchema.getCollection().update(
                minute._id,
                {
                    $set: {
                        'participantsAdditional': minute.participants,
                        'participants': []
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
                        'participants': minute.participantsAdditional
                    }
                },
                {bypassCollection2: true}
            );
        });
        // delete the participantsAdditional attribute from all minutes
        MinutesSchema.getCollection().update({},
            {$unset: { participantsAdditional: 1 }},
            {multi: true, bypassCollection2: true});
    }
}
