import { Meteor } from "meteor/meteor";
import { User } from "/imports/user";

export class ResponsibleResolver {
  // this should only be called from server.
  // because EMails are not propagated to the client!
  static resolveEmailAddressesForResponsibles(responsibleList) {
    if (Meteor.isClient || !responsibleList || responsibleList.length === 0) {
      return [];
    }

    return responsibleList
      .map((userIdOrEmail) => {
        let emailFromDb = "";
        let userNameFromDB = "";
        if (userIdOrEmail.length > 15) {
          // maybe DB Id or free text
          const user = Meteor.users.findOne(userIdOrEmail);
          if (user) {
            userNameFromDB = user.username;
            if (user.emails?.length) {
              emailFromDb = user.emails[0].address;
            }
          }
        }
        if (emailFromDb) {
          return emailFromDb;
        } else {
          const freetextMail = userIdOrEmail.trim();
          if (/\S+@\S+\.\S+/.test(freetextMail)) {
            // check valid mail anystring@anystring.anystring
            return freetextMail;
          } else {
            console.log(
              "WARNING: Invalid mail address for responsible: >" +
                freetextMail +
                "< " +
                userNameFromDB,
            );
            return null;
          }
        }
      })
      .filter((email) => email !== null);
  }

  static resolveResponsibles(responsibleList, prefix = "") {
    if (!responsibleList || responsibleList.length === 0) {
      return [];
    }
    return responsibleList.map((userIdOrEmail) => {
      let userNameFromDb = "";
      if (userIdOrEmail.length > 15) {
        // maybe DB Id or free text
        const user = new User(userIdOrEmail);
        if (user.OK) {
          userNameFromDb = user.profileNameWithFallback();
        }
      }
      return prefix + (userNameFromDb ? userNameFromDb : userIdOrEmail);
    });
  }

  /**
   * Get comma separated list of responsibles with human readable user name (for all registered users)
   * @param responsibleList {string[]} - array of userIds or strings like name or e-mail-address
   * @param prefix - optional, e.g. '@'
   * @returns {string}
   */
  static resolveAndformatResponsiblesString(responsibleList, prefix = "") {
    return ResponsibleResolver.resolveResponsibles(
      responsibleList,
      prefix,
    ).join("; ");
  }
}
