import { Meteor } from 'meteor/meteor';
import _ from 'lodash';

function get(path, def = undefined) {
    return _.get(Meteor.settings, `ldap.${path}`, def);
}

function set(path, value) {
    _.set(Meteor.settings, `ldap.${path}`, value);
}

function disableLdap() {
    set('enabled', false);
}

const defaultPropertyMap = {
    username: "cn",
    email: "mail"
};

const defaultLdapSettings = {
    enabled: false,
    authentication: {},
    searchFilter: '',
    allowSelfSignedTLS: false,
    whiteListedFields: [],
    inactiveUsers: {strategy: 'none'},
    autopublishFields: [],
    importCronTab: false
};

Meteor.settings.ldap = Object.assign(defaultLdapSettings, Meteor.settings.ldap);

export class LdapSettings {
    static publish() {
        Meteor.settings.public.ldapEnabled = LdapSettings.ldapEnabled();
    }

    static loadSettings() {
        Meteor.settings.ldap = Object.assign({}, defaultLdapSettings, Meteor.settings.ldap);

        // backwards compatibility: support searchDn property
        const propertyMap = Object.assign({}, defaultPropertyMap),
            searchDn = get('searchDn');
        if (!get('propertyMap') && searchDn) {
            propertyMap.username = searchDn;
        }

        Meteor.settings.ldap.propertyMap = Object.assign({}, propertyMap, Meteor.settings.ldap.propertyMap);
    }

    static loadSettingsAndPerformSanityCheck() {
        LdapSettings.loadSettings();

        if (!LdapSettings.ldapEnabled()) {
            return;
        }

        if (LdapSettings.ldapServer() === undefined) {
            disableLdap();
            return;
        }

        if (LdapSettings.serverDn() === undefined) {
            disableLdap();
            return;
        }

        const propertyMap = LdapSettings.propertyMap();
        if (!propertyMap.username || !propertyMap.email) {
            disableLdap();
            return;
        }
    }

    static ldapEnabled() {
        return get('enabled', false);
    }

    static ldapServer() {
        return get('serverUrl');
    }

    static serverDn() {
        return get('serverDn');
    }

    static searchFilter() {
        return get('searchFilter', '');
    }

    static propertyMap() {
        return get('propertyMap');
    }

    static usernameAttribute() {
        return get('propertyMap.username');
    }

    static emailAttribute() {
        return get('propertyMap.email');
    }

    static allowSelfSignedTLS() {
        return get('allowSelfSignedTLS', false);
    }
}