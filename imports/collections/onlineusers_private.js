import { Meteor } from 'meteor/meteor';
import { OnlineUsersSchema } from './onlineusers.schema';

if (Meteor.isServer) {
    Meteor.publish('onlineUsersForRoute', function (route) {
        return OnlineUsersSchema.find({activeRoute: route});
    });
}

const checkRouteParamAndAuthorization = (route, userId) => {
    check(route, String);
    if (!userId) {
        throw new Meteor.Error('not-authorized');
    }
};

Meteor.methods({
    'onlineUsers.enterRoute'(route) {
        const userId = Meteor.userId();
        checkRouteParamAndAuthorization(route, userId);

        OnlineUsersSchema.insert({
            userId: userId,
            activeRoute:route,
            updatedAt: new Date()
        });
    },
    'onlineUsers.leaveRoute'(route) {
        const userId = Meteor.userId();
        checkRouteParamAndAuthorization(route, userId);
        OnlineUsersSchema.remove({userId: userId, activeRoute:route});
    }
});