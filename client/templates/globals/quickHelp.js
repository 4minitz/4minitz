import { Template } from 'meteor/templating';
import { User, userSettings } from '/imports/users';

Template.quickHelp.helpers({
    isQuickHelpVisible() {
        const quickHelpContext = Template.instance().data.context;
        const user = new User();
        const isDemoUser = user.user.isDemoUser;
        return isDemoUser || user.getSetting(userSettings.showQuickHelp[quickHelpContext], true);
    }
});

Template.quickHelp.events({
    'click .clickHideQuickHelp'(evt, tmpl) {
        evt.preventDefault();
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp[tmpl.data.context], false);
    }
});