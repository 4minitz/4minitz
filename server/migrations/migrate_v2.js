import { MinutesCollection } from '/imports/collections/minutes_private';

// convert the participants fields
export class MigrateV2 {

    static up() {
        MinutesCollection.find().forEach(minute => {
            if (!minute.participants) {
                minute.participants = '';
            }

            // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
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
        MinutesCollection.find().forEach(minute => {
            MinutesCollection.update(
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
        MinutesCollection.update({}, 
            {$unset: { participantsAdditional: 1 }},
            {multi: true, bypassCollection2: true});
    }
}
