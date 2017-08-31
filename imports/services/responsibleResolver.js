import { Meteor } from 'meteor/meteor';

export class ResponsibleResolver {

    static resolveResponsibles(responsibleList, prefix = '') {
        if (!responsibleList || responsibleList.length === 0) {
            return [];
        }
        return responsibleList
            .map((userIdOrEmail) => {
                let userNameFromDb = '';
                if (userIdOrEmail.length > 15) { // maybe DB Id or free text
                    const user = Meteor.users.findOne(userIdOrEmail);
                    if (user) {
                        userNameFromDb = user.username;
                    }
                }
                return prefix + ( (userNameFromDb) ? userNameFromDb : userIdOrEmail );
            });
    }

    /**
     * Get comma separated list of responsibles with human readable user name (for all registered users)
     * @param responsibleList {string[]} - array of userIds or strings like name or e-mail-address
     * @param prefix - optional, e.g. '@'
     * @returns {string}
     */
    static resolveAndformatResponsiblesString(responsibleList, prefix = '') {
        return ResponsibleResolver.resolveResponsibles(responsibleList, prefix).join(', ');
    }
}