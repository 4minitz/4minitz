import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';
import './idValidator';

const OnlineUsersCollection = new Mongo.Collection('onlineUsers');

export const OnlineUsersSchema = SchemaClass.create({
    name: 'OnlineUsersSchema',
    collection: OnlineUsersCollection,
    fields: {
        userId: {type: String, validators: [{type: 'meteorId'}]},
        activeRoute: {type: String},
        updatedAt: {type: Date}
    }
});
