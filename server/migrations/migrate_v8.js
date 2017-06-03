import { MeetingSeriesSchema } from '/imports/collections/meetingseries.schema';

// MeetingSeries: add responsiblesFreeText field
export class MigrateV8 {
    static up() {
        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $set: {
                        'additionalResponsibles': []
                    }
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        MeetingSeriesSchema.getCollection().find().forEach(series => {
            MeetingSeriesSchema.getCollection().update(
                series._id,
                {
                    $unset: {
                        'additionalResponsibles': ''
                    }
                },
                {bypassCollection2: true}
            );
        });
    }
}
