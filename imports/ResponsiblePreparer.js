let _emailAddressRegExp = global.emailAddressRegExpTest;

export class ResponsiblePreparer {

    constructor(minutes, currentTopicOrItem, usersCollection, onlyValidMailAddressesAllowed = false) {
        this.minutes = minutes;
        this.parentSeries = minutes.parentMeetingSeries();
        this.currentTopioc = currentTopicOrItem;
        this.usersCollection = usersCollection;
        this.onlyValidMailAddressesAllowed = onlyValidMailAddressesAllowed;

        this.possibleResponsibles = [];          // sorted later on
        this.possibleResponsiblesUnique = {};    // ensure uniqueness
        this.buffer = [];                        // userIds and names from different sources, may have doubles
    }

    getPossibleResponsibles() {
        let possibleResponsibles = this.possibleResponsibles;
        let possibleResponsiblesUnique = this.possibleResponsiblesUnique;
        let buffer = this.buffer;

        // add regular participants from current minutes
        let aMin = this.minutes;
        for (let i in aMin.participants) {
            this._addUserIdToBuffer(aMin.participants[i].userId);
        }

        // add the "additional participants" from current minutes as simple strings
        let participantsAdditional = aMin.participantsAdditional;
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
            buffer = buffer.concat(topic._topicDoc.responsibles);
        }

        // copy buffer to possibleResponsibles
        // but take care for uniqueness
        for (let i in buffer) {
            let aResponsibleId = buffer[i];
            if (! possibleResponsiblesUnique[aResponsibleId]) { // not seen?
                possibleResponsiblesUnique[aResponsibleId] = true;
                let aResponsibleName = aResponsibleId;
                let aUser = this.usersCollection.findOne(aResponsibleId);
                if (aUser) {
                    aResponsibleName = aUser.username;
                    if (aUser.profile && aUser.profile.name && aUser.profile.name !== "") {
                        aResponsibleName += " - "+aUser.profile.name;
                    }
                }
                possibleResponsibles.push({id: aResponsibleId, text: aResponsibleName});
            }
        }

        return possibleResponsibles;
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
        return (!this.onlyValidMailAddressesAllowed || _emailAddressRegExp.test(text));
    }

    _addFormerResponsiblesFromParentSeries() {
        if (!this.parentSeries.additionalResponsibles) {
            return;
        }
        if (this.onlyValidMailAddressesAllowed) {
            this.parentSeries.additionalResponsibles.forEach(resp => {
                this._addFreeTextElementToBuffer(resp);
            });
        } else {
            this.buffer = this.buffer.concat(this.parentSeries.additionalResponsibles);
        }
    }
}