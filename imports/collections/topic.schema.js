import { Class as SchemaClass } from 'meteor/jagi:astronomy';

import './idValidator';
import { InfoItemSchema } from './infoitem.schema';

export const TopicSchema = SchemaClass.create({
    name: 'TopicSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        createdInMinute: {type: String, validators: [{type: 'meteorId'}]},
        subject: {type: String},
        responsibles: {type: [String], default: [], optional: true},
        isOpen: {type: Boolean, default: true},
        isRecurring: {type: Boolean, default: false},
        isNew: {type: Boolean, default: true},
        infoItems: {type: [InfoItemSchema], default: []},
        labels: {type: [String], validators: [{type: 'meteorId'}]},
        isSkipped: {type: Boolean, default: false }
    }
});