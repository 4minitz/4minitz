import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Minutes } from '/imports/minutes';
import { MinutesFinder } from '/imports/services/minutesFinder';

export class addMinutes{
    addMinutes(msid,msob) {
        let newMinutesId;
        let meetingSeriesId = msid;
        let ms=msob;
        console.log('MS ID: ', meetingSeriesId)
        ms.addNewMinutes(
            // optimistic ui callback
            newMinutesID => {
                newMinutesId = newMinutesID;
            },
            // server callback
            (error) => {
                if(error) handleError(error);
            }
        );
        if (newMinutesId) { // optimistic ui callback should have been called by now
            let lastFinalizedMin = MinutesFinder.lastFinalizedMinutesOfMeetingSeries(ms);
            if (lastFinalizedMin && lastFinalizedMin.globalNotePinned) {
                let aMin = new Minutes(newMinutesId);
                if (aMin) {
                    aMin.update({
                        globalNotePinned: true,
                        globalNote: lastFinalizedMin.globalNote
                    });
                }
            }
            FlowRouter.redirect('/minutesedit/' + newMinutesId);
        }
    }
};