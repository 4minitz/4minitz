export class ResponsiblePreparer {

    constructor(minutes, currentTopicOrItem, usersCollection, freeTextValidator = undefined) {
        this.minutes = minutes;
        this.parentSeries = minutes.parentMeetingSeries();
        this.currentTopioc = currentTopicOrItem;
        this.usersCollection = usersCollection;
        this.freeTextValidator = freeTextValidator;

        this.possibleResponsibles = [];          // sorted later on
        this.possibleResponsiblesUnique = {};    // ensure uniqueness
        this.buffer = [];                        // userIds and names from different sources, may have doubles

        this.remainingUsers = [];
    }

    getPossibleResponsibles() {
        return this.possibleResponsibles;
    }

    getRemainingUsers() {
        return this.remainingUsers;
    }

    prepareResponsibles() {
        this._preparePossibleResponsibles();
        this._prepareRemainingUsers();
    }

    _preparePossibleResponsibles() {
        // add regular participants from current minutes
        for (let i in this.minutes.participants) {
            this._addUserIdToBuffer(this.minutes.participants[i].userId);
        }

        // add the "additional participants" from current minutes as simple strings
        let participantsAdditional = this.minutes.participantsAdditional;
        if (participantsAdditional) {
            let splitted = participantsAdditional.split(/[,;]/);
            for (let i in splitted) {
                this._addFreeTextElementToBuffer(splitted[i].trim());
            }
        }

        // add former responsibles from the parent meeting series
        this._addFormerResponsiblesFromParentSeries();


        // add the responsibles from current topic
        let topic = this.currentTopioc;
        if (topic && topic.hasResponsibles()) {
            this.buffer = this.buffer.concat(topic._topicDoc.responsibles);
        }

        // copy buffer to possibleResponsibles
        // but take care for uniqueness
        for (let i in this.buffer) {
            let aResponsibleId = this.buffer[i];
            if (! this.possibleResponsiblesUnique[aResponsibleId]) { // not seen?
                this.possibleResponsiblesUnique[aResponsibleId] = true;
                let aResponsibleName = aResponsibleId;
                let aUser = this.usersCollection.findOne(aResponsibleId);
                if (aUser) {
                    aResponsibleName = aUser.username;
                    if (aUser.profile && aUser.profile.name && aUser.profile.name !== "") {
                        aResponsibleName += " - "+aUser.profile.name;
                    }
                }
                this.possibleResponsibles.push({id: aResponsibleId, text: aResponsibleName});
            }
        }
    }

    _addUserIdToBuffer(userid) {
        this.buffer.push(userid);
    }

    _addFreeTextElementToBuffer(text) {
        if (this._isValidFreeTextElement(text)) {
            this.buffer.push(text);
        }
    }

    _isValidFreeTextElement(text) {
        return (!this.freeTextValidator || this.freeTextValidator(text));
    }

    _addFormerResponsiblesFromParentSeries() {
        if (!this.parentSeries.additionalResponsibles) {
            return;
        }
        if (this.freeTextValidator) {
            this.parentSeries.additionalResponsibles.forEach(resp => {
                this._addFreeTextElementToBuffer(resp);
            });
        } else {
            this.buffer = this.buffer.concat(this.parentSeries.additionalResponsibles);
        }
    }

    _prepareRemainingUsers() {
        let participantsIds = [];
        for (let i in this.possibleResponsibles) {
            if (this.possibleResponsibles[i].id && this.possibleResponsibles[i].id.length > 15) {   // Meteor _ids default to 17 chars
                participantsIds.push(this.possibleResponsibles[i].id);
            }
        }

        // format return object suiting for select2.js
        let users = this.usersCollection.find(
            {$and: [{_id: {$nin: participantsIds}},
                {isInactive: {$not: true}}]}).fetch();

        for (let i in users) {
            let usertext = users[i].username;
            if (users[i].profile && users[i].profile.name && users[i].profile.name !== "") {
                usertext += " - "+users[i].profile.name;
            }
            this.remainingUsers.push ({id: users[i]._id, text: usertext});
        }
    }
}