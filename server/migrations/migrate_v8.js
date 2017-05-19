import { MeetingSeriesCollection } from '/imports/collections/meetingseries_private';

// MeetingSeries: add responsiblesFreeText field
export class MigrateV8 {
    static up() {
        MeetingSeriesCollection.find().forEach(series => {
            MeetingSeriesCollection.update(
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
        MeetingSeriesCollection.find().forEach(series => {
            MeetingSeriesCollection.update(
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
