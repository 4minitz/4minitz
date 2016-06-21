import { MinutesCollection } from '/imports/collections/minutes_private'

// ActionItems: convert the responsible (string) => responsibles (array) fields
export class MigrateV6 {

    static up() {
        MinutesCollection.find().forEach(minute => {
            minute.topics.forEach(topic => {
                topic.infoItems.forEach(item => {
                    item.responsibles = [];
                    if (item.responsible) {
                        let resp = item.responsible.split(",");
                        resp.forEach(r => { r = r.trim();});
                        item.responsibles = resp;
                        delete item.responsible;
                    }
                });
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });
    }

    static down() {
        MinutesCollection.find().forEach(minute => {
            minute.topics.forEach(topic => {
                topic.infoItems.forEach(item => {
                    item.responsible = "";
                    if (item.responsibles && item.responsibles.length) {
                        item.responsible = item.responsibles.join();
                    }
                    delete item.responsibles;
                });
            });

            // We switch on bypassCollection2 here, to skip .clean & .validate to allow empty string values
            MinutesCollection.update(
                minute._id,
                {
                    $set: {topics: minute.topics}
                },
                {bypassCollection2: true}
            );
        });
    }
}
