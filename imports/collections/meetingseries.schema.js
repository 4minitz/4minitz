import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import { LabelSchema } from './label.schema';
import { MeetingSeries } from '../meetingseries';
import './idValidator';

let MeetingSeriesCollection = new Mongo.Collection('meetingSeries', {
    transform: function (doc) {
        return new MeetingSeries(doc);
    }
});

export const MeetingSeriesSchema = SchemaClass.create({
    name: 'MeetingSeriesSchema',
    collection: MeetingSeriesCollection,
    fields: {
        project: {type: String},
        name: {type: String},
        createdAt: {type: Date},
        visibleFor: {type: [String], validators: [{type: 'meteorId'}]},
        // element may be userID or EMail address
        informedUsers: {type: [String], optional: true},
        // todo: make this a date?
        lastMinutesDate: {type: String},
        lastMinutesFinalized: {type: Boolean, default: false},
        lastMinutesId: {type: String, optional: true, validators: 
            [{type: 'or',
                param: [
                    {type: 'null'},
                    {type: 'meteorId'}                    
                ]
            }]},
        minutes: {type: [String], default: []},
        availableLabels: {type: [LabelSchema], default: []},
        additionalResponsibles: {type: [String], default: []}
    }
});