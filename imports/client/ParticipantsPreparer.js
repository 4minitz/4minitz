export class ParticipantsPreparer {

    /**
     * @typedef {{id: string, text: string}} ResponsibleObject
     */

    constructor(minutes, currentTopicOrItem, usersCollection, freeTextValidator = undefined) {
        this.minutes = minutes;
        this.parentSeries = minutes.parentMeetingSeries();
        this.currentElement = currentTopicOrItem;
        this.usersCollection = usersCollection;
        this.freeTextValidator = freeTextValidator;
        this._init();
        this._prepareResponsibles();
    }

    _init() {
        this.possibleResponsibles = [];          // sorted later on
        this.possibleResponsiblesUnique = {};    // ensure uniqueness
        this.buffer = [];                        // userIds and names from different sources, may have doubles
    }

    /**
     * @return {ResponsibleObject[]}
     */
    getPossibleResponsibles() {
        return this.possibleResponsibles;
    }

    _prepareResponsibles() {
        this._preparePossibleResponsibles();
    }

    _preparePossibleResponsibles() {
        this._addRegularParticipantsFromCurrentMinutes();
        this._addAdditionalParticipantsFromMinutesAsFreetext();
        this._addFormerResponsiblesFromParentSeries();
        this._addResponsiblesFromCurrentElement();
        this._pruneDuplicatesAndPrepareResult();
    }

    _addRegularParticipantsFromCurrentMinutes() {
        this.minutes.participants.forEach(participant => {
            this.buffer.push(participant.userId);
        });
    }

    _addAdditionalParticipantsFromMinutesAsFreetext() {
        let participantsAdditional = this.minutes.participantsAdditional;
        if (participantsAdditional) {
            participantsAdditional.split(/[,;]/).forEach(freeText => {
                this._addFreeTextElementToBuffer(freeText.trim());
            });
        }
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

    _addResponsiblesFromCurrentElement() {
        if (this.currentElement && this.currentElement.hasResponsibles()) {
            this.buffer = this.buffer.concat(this.currentElement.getResponsibles());
        }
    }

    _pruneDuplicatesAndPrepareResult() {
        this.buffer.forEach(userIdOrFreeText => {
            if (!this.possibleResponsiblesUnique[userIdOrFreeText]) {
                this.possibleResponsiblesUnique[userIdOrFreeText] = true;
                this.possibleResponsibles.push(this._createResponsibleObject(userIdOrFreeText));
            }
        });
    }

    /**
     *
     * @param userIdOrFreeTextOrUserObject
     * @return {ResponsibleObject}
     * @private
     */
    _createResponsibleObject(userIdOrFreeTextOrUserObject) {
        let user = userIdOrFreeTextOrUserObject;
        if (typeof userIdOrFreeTextOrUserObject === 'string') {
            user = this.usersCollection.findOne(userIdOrFreeTextOrUserObject);
            if (!user) {
                return {id: userIdOrFreeTextOrUserObject, text: userIdOrFreeTextOrUserObject, stringIdentifier: userIdOrFreeTextOrUserObject};
            }
        }

        return {id: user._id, text: ParticipantsPreparer._formatUser(user), stringIdentifier: user.username};
    }

    static _formatUser(user) {
        let usertext = user.username;
        if (user.profile && user.profile.name && user.profile.name !== '') {
            usertext += ` - ${user.profile.name}`;
        }
        return usertext;
    }

    _addFreeTextElementToBuffer(text) {
        if (!this.freeTextValidator || this.freeTextValidator(text)) {
            this.buffer.push(text);
        }
    }
}