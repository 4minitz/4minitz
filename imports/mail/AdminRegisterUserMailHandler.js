import { Meteor } from 'meteor/meteor';

import { MailFactory } from './MailFactory'
import { GlobalSettings } from './../GlobalSettings'

export class AdminRegisterUserMailHandler {
    constructor(newUserId, includePassword, password) {
        this._includePassword = includePassword;
        this._password = password;
        this._user = Meteor.users.findOne(newUserId);
        if (!this._user) {
            throw new Meteor.Error("Send Admin Mail", "Could not find user: "+newUserId);
        }
    }

    send() {
        let emails = Meteor.user().emails;
        let adminFrom = (emails && emails.length > 0)
            ? emails[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();

        if (this._user.emails && this._user.emails.length > 0) {
            let mailer = MailFactory.getMailer(adminFrom, this._user.emails[0].address);
            mailer.setSubject("Your new account at our 4Minitz server");
            mailer.setText("Hello " + this._user.profile.name+ ", \n"+
                "\n"+
                "Welcome to our 4Minitz WebApp.\n" +
                "Now you can start to participate in keeping of professional meeting minutes.\n"+
                "\n"+
                "You may sign in with 'Standard' (not LDAP!) login at:\n"+
                "    Your host     : "+GlobalSettings.getRootUrl()+"\n"+
                "    Your user     : "+this._user.username+"\n"+
                (this._includePassword ? "    Your password : "+ this._password + "\n": "    Contact admin for password.\n")+
                "\n" +
                "Have fun!\n\n" +
                "        Your Admin.\n"
            );
            mailer.send();
        } else {
            console.error("Could not send admin register mail. User has no mail address: "+this._user._id);
        }
    }
}
