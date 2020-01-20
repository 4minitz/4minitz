import { Meteor } from 'meteor/meteor';
import { i18n } from 'meteor/universe:i18n';
import { T9n } from 'meteor/softwarerero:accounts-t9n';

// Only server can provide all available languages via server-side method
Meteor.methods({
    getAvailableLocales() {
        // [{code: "el", name: "Greek", nameNative: "Ελληνικά"}, ...]
        return i18n.getLanguages().map(code => ({
            code,
            name: i18n.getLanguageName(code),
            nameNative: i18n.getLanguageNativeName(code)[0].toUpperCase() + i18n.getLanguageNativeName(code).slice(1),
        }));
    },
    getAvailableLocaleCodes() {
        // ["en-US", "de", "el"]
        return i18n.getLanguages();
    }
});

export class I18nHelper {
    static availableLocaleCodes = [];

    static initialize() {
        Meteor.call('getAvailableLocaleCodes',
            function(error, result){
                if(error){
                    console.log('Error: No supported language locales reported by server.');
                }else{
                    I18nHelper.availableLocaleCodes = result;
                }
            }
        );
    }

    // setLanguageLocale() has two modes:
    // 1. No locale given
    //      => determine preference (first user, then browser)
    // 2. Given locale (e.g., 'en-US')
    //      => store this in user profile (if not demo user)
    // Finally: set it in i18n
    static setLanguageLocale(localeCode) {
        if (!localeCode) {
            localeCode = I18nHelper._getPreferredUserLocale();
        } else if (Meteor.user() && !Meteor.user().isDemoUser) {
            if (localeCode === 'auto') {
                Meteor.users.update({_id: Meteor.userId()}, {$unset: {'profile.locale': ''}});
                localeCode = I18nHelper._getPreferredBrowserLocale();
            } else {
                Meteor.users.update({_id: Meteor.userId()}, {$set: {'profile.locale': localeCode}});
            }
        }
        console.log('Switch to language locale: >'+localeCode+'<');
        i18n.setLocale(localeCode)
            .then(resp => {
                T9n.setLanguage(localeCode)
            })
            .catch(e => {
                console.log('Error switching to: >'+localeCode+'<');
                const fallbackLocale = 'en-US';
                console.log('Switching to fallback: >'+fallbackLocale+'<');
                i18n.setLocale(fallbackLocale);
                T9n.setLanguage(fallbackLocale);
            });
    }

    static getLanguageLocale() {
        if (!Meteor.user() || !Meteor.user().profile || !Meteor.user().profile.locale) {
            return 'auto';
        }
        return i18n.getLocale();
    }

    static _getPreferredUserLocale () {
        if (Meteor.settings.isEnd2EndTest) {
            return 'en-US';
        }
        return (
            Meteor.user() && Meteor.user().profile && Meteor.user().profile.locale ||
            I18nHelper._getPreferredBrowserLocale()
        );
    }

    static _getPreferredBrowserLocale () {
        if (Meteor.settings.isEnd2EndTest) {
            return 'en-US';
        }
        return (
            navigator.languages && navigator.languages[0] ||
            navigator.language ||
            navigator.browserLanguage ||
            navigator.userLanguage ||
            'en-US'
        );
    }

}
