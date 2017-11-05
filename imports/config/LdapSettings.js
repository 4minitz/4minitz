import { Meteor } from 'meteor/meteor';
import _ from 'lodash';

function get(path, def = undefined) {
    return _.get(Meteor.settings, `ldap.${path}`, def);
}

export class LdapSettings {
    static publish() {
        Meteor.settings.public.ldapEnabled = LdapSettings.ldapEnabled();
    }

    static check() {
        if (!LdapSettings.ldapEnabled()) {
            return;
        }
    }

    static ldapEnabled() {
        return get('enabled', false);
    }
}