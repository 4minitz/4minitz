import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Minutes } from '/imports/minutes';

export function select2search(selectResponsibles, delayTime, freeTextValidator, minuteID) {
    selectResponsibles.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        ajax: {
            delay: delayTime,
            transport: function(params, success, failure) {
                Meteor.call('responsiblesSearch', params.data.q, minuteID, freeTextValidator, function(err, results) {
                    if (err) {
                        failure(err);
                        return;
                    }
                    success(results);
                });
            },
            processResults: function(data) {
                let results_participants = [];
                let results_other = [];
                _.each(data.results, function (result) {
                    if (result.isParticipant) {
                        results_participants.push({
                            id: result.userId,
                            text: result.fullname
                        });
                    }
                    else results_other.push({
                        id: result._id,
                        text: result.fullname
                    });
                });
                // save the return value (when participants/other user are empty -> do not show a group-name
                let returnValues = [];
                if (results_participants.length > 0)
                    returnValues.push({text:'Participants', children: results_participants});
                if (results_other.length > 0)
                    returnValues.push({text:'Other Users', children: results_other});

                return {
                    results:returnValues
                };
            }}
    });
}

export function addResponsibleOptions(SelectResponsibleElementID, topicOrItemDoc){
    let data = {options: []};
    if (topicOrItemDoc !== undefined) {
        topicOrItemDoc.responsibles.forEach(responsibleId => {
            let responsibleUser = Meteor.users.findOne(responsibleId);
            if (!responsibleUser) { //free text user
                responsibleUser = {fullname: responsibleId};
            } else {
                Minutes.formatResponsibles(responsibleUser, 'username', responsibleUser.profile);
            }
            data.options.push({optionId: responsibleId, optionText: responsibleUser.fullname});
        });
        Blaze.renderWithData(Template['optionsElement'], data, document.getElementById(SelectResponsibleElementID));
    }
}
