import { Meteor } from 'meteor/meteor';

import { Minutes } from './../minutes';
import { UserRoles } from './../userroles';
import { TemplateRenderer } from './../server_side_templates/TemplateRenderer';
import { DocumentGeneration } from './../documentGeneration';

Meteor.methods({
    'documentgeneration.createHTML'(minuteID) {
        //Check DocumentGeneration is enabled and user has rights to continue
        if (Meteor.settings.public.docGeneration.enabled !== true) {
            return;
        }

        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized', 'You are not authorized to perform this action.');
        }

        let minute = new Minutes(minuteID);
        let userRoles = new UserRoles(Meteor.userId());
        if (!userRoles.isInvitedTo(minute.parentMeetingSeriesID())) {
            throw new Meteor.Error('Cannot download this minute', 'You are not invited to the meeting series.');
        }

        let topics = minute.getTopicsWithOnlyInfoItems();
        let documentHandler = {
            _topics: topics,
            _minute: minute,
            _meetingSeries: minute.parentMeetingSeries(),
            _participants: minute.getParticipants(Meteor.users),
            _informed: minute.getInformed(Meteor.users),
            _userArrayToString: function(users) {
                return users.map(function(user){
                    return user.name;
                }).join(', ');
            }
        };

        DocumentGeneration.generateResponsibleStringsForTopic(documentHandler);
        let templateData = DocumentGeneration.getDocumentData(documentHandler);

        let tmplRenderer = new TemplateRenderer('publishInfoItems', 'server_templates/email').addData('name', '');
        tmplRenderer.addDataObject(templateData);
        DocumentGeneration.addHelperForHTMLMail(tmplRenderer, documentHandler);
        return tmplRenderer.render();
    }
});
