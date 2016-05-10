

export class UserEditConfig {
    constructor (mode, currentUserReadOnly, meetingSeriesID, users) {
        this.mode = mode;
        this.currentUserReadOnly = currentUserReadOnly;
        this.meetingSeriesID = meetingSeriesID;
        this.users = users;
    }
}
