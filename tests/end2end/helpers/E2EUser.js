
import { E2EGlobal } from './E2EGlobal'


export class E2EUser {
    static changePassword(oldPassword, newPassword1, newPassword2){
        browser.setValue('input[id="id_oldPassword"]', oldPassword);
        browser.setValue('input[id="id_newPassword1"]', newPassword1);
        browser.setValue('input[id="id_newPassword2"]', newPassword2);

        browser.keys(['Enter']);
        E2EGlobal.waitSomeTime();
    }

    static editProfile(longName, eMail, saveParameter=true){
        browser.setValue('input[id="id_longName"]', longName);
        browser.setValue('input[id="id_emailAddress"]', eMail);
        if (saveParameter){
            browser.keys(['Enter']);
        }
        E2EGlobal.waitSomeTime();
    }

    static checkProfileChanged(longName, email){
        let profileChanged = false;
        profileChanged = browser.execute( function(longName, email)
        {
            let profileChanged = false;

            if (((!Meteor.user().profile) || (Meteor.user().profile.name == longName)) && (Meteor.user().emails[0].address == email)){
                profileChanged = true;
            }
            return profileChanged;
        }, longName, email);
        return profileChanged;
    }

}


