import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import './idValidator';

export const LabelSchema = SchemaClass.create({
    name: 'LabelSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        isDefaultLabel: {type: Boolean, default: false},
        isDisabled: {type: Boolean, default: false},
        name: {type: String},
        color: {type: String, default: '#e6e6e6'}
    }
});
