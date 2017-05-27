
import {VERSION_INFO} from '/imports/gitversioninfo'
import { UpdateChecksCollection } from '/imports/collections/server_private'

// #Security: The rate limiter ensures that nobody can flood our
// server with useless queries. Next query from same IP Address
// will be handled after MINWAIT_SECONDS
const MINWAIT_MINUTES = 60;
let ipaddress2timeMS = {};
let rateLimitOK = function (ip) {
    let ipLastTimeMS = ipaddress2timeMS[ip];
    let nowTimeMS = new Date().getTime();
    ipaddress2timeMS[ip] = nowTimeMS;
    if (ipLastTimeMS) {
        if (ipLastTimeMS + MINWAIT_MINUTES*60*1000 > nowTimeMS) {
            return false;
        }
    }
    return true;
};

// The updateCheck master route on the server is per default inactive.
// It must be turned on explicitly via settings.json globally:
// "updateCheckMaster": true,
if (Meteor.settings.updateCheckMaster === true) {
    Picker.route('/updatecheck/:slaveUID/:slaveVersion', function(params, req, res, next) {
        res.setHeader("Content-Type", "application/json");
        if (rateLimitOK(req.connection.remoteAddress)) {
            let logDoc = {
                timeStamp: new Date(),
                slaveUID: params.slaveUID,
                slaveVersion: params.slaveVersion,
                remoteAddress: req.connection.remoteAddress,
            };
            UpdateChecksCollection.update(
                {"clientUID": params.clientUID},
                logDoc,
                {upsert: true}
            );

            res.end(JSON.stringify(VERSION_INFO));
            return;
        }
        res.end("{'message': 'Ratelimit reached!}");
    });
}
