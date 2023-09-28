import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";
import { T9n } from "meteor/softwarerero:accounts-t9n";
import "./promisedMethods";

// Only server can provide all available languages via server-side method
Meteor.methods({
  getAvailableLocales() {
    // [{code: "el", name: "Greek", nameNative: "Ελληνικά"}, ...]
    return i18n.getLanguages().map((code) => {
      if (code.toLowerCase() === "de-li") {
        return {
          code: code,
          codeUI: "de-Fr",
          name: "German (Franconian)",
          nameNative: "Deutsch (Fränggisch)",
        };
      }
      return {
        code: code,
        codeUI: code,
        name: i18n.getLanguageName(code),
        nameNative:
          i18n.getLanguageNativeName(code)[0].toUpperCase() +
          i18n.getLanguageNativeName(code).slice(1),
      };
    });
  },
  getAvailableLocaleCodes() {
    // ["el", "de", "zh-CN", "zh-TW"]
    return i18n.getLanguages();
  },
});

export class I18nHelper {
  static supportedCodes = [];

  // setLanguageLocale() has two modes:
  // 1. No locale given
  //      => determine preference (first user, then browser)
  // 2. Given locale (e.g., 'en-US')
  //      => store this in user profile (if not demo user)
  // Finally: set it in i18n
  static async setLanguageLocale(localeCode) {
    if (I18nHelper.supportedCodes.length === 0) {
      // cache the supported languages
      try {
        I18nHelper.supportedCodes = await Meteor.callPromise(
          "getAvailableLocaleCodes",
        );
      } catch (err) {
        console.log(
          "Error callPromise(getAvailableLocaleCodes): No supported language locales reported by server.",
        );
      }
    }

    if (!localeCode) {
      localeCode = I18nHelper._getPreferredUserLocale();
    } else {
      I18nHelper._persistLanguagePreference(localeCode);
    }
    console.log("Switch to language locale: >" + localeCode + "<");
    if (localeCode === "auto") {
      localeCode = I18nHelper._getPreferredBrowserLocale();
      console.log(" Browser language locale: >" + localeCode + "<");
    }

    i18n
      .setLocale(localeCode)
      .then(() => T9n.setLanguage(localeCode))
      .catch((e) => {
        console.log("Error switching to: >" + localeCode + "<");
        console.error(e);
        const fallbackLocale = "en-US";
        console.log("Switching to fallback: >" + fallbackLocale + "<");
        i18n.setLocale(fallbackLocale);
        T9n.setLanguage(fallbackLocale);
      });
  }

  static getLanguageLocale() {
    if (
      !Meteor.user() ||
      !Meteor.user().profile ||
      !Meteor.user().profile.locale
    ) {
      return "auto";
    }
    return i18n.getLocale();
  }

  static _getPreferredUserLocale() {
    if (Meteor.settings?.public && Meteor.settings.public.isEnd2EndTest) {
      return "en-US";
    }
    return (
      (Meteor.user() &&
        Meteor.user().profile &&
        Meteor.user().profile.locale) ||
      I18nHelper._getPreferredBrowserLocale()
    );
  }

  static _getPreferredBrowserLocale() {
    if (Meteor.settings.isEnd2EndTest) {
      return "en-US";
    }

    return (
      I18nHelper._getPreferredBrowserLocaleByPrio() ||
      navigator.language ||
      navigator.browserLanguage ||
      navigator.userLanguage ||
      "en-US"
    );
  }

  // If browser has a prioritized array of preferred languages,
  // we want to determine the "highest" priority language, that
  // we actually support
  static _getPreferredBrowserLocaleByPrio() {
    if (!navigator.languages || !navigator.languages[0]) {
      return undefined; // no browser language, so we can't support any
    }

    // console.log('4Minitz:', I18nHelper.supportedCodes);  // plz. keep for debugging
    const supported = {};
    I18nHelper.supportedCodes.forEach((code) => {
      supported[code] = code; // remember we support: 'de-CH'
      let codeShort = code.split("-", 1)[0];
      if (!supported[codeShort]) {
        supported[codeShort] = code; // remember we support: 'de' via 'de-CH'
      }
    });
    // console.log('Browser:', navigator.languages);        // plz. keep for debugging
    for (let code of navigator.languages) {
      // First try: use exact codes from browser
      if (supported[code]) {
        // 'de-DE'
        return supported[code];
      } else {
        let codeShort = code.split("-", 1)[0]; // 'de'
        if (supported[codeShort]) {
          // Second try: use prefix codes from browser
          return supported[codeShort]; // but return the more precise 'de-CH'
        }
      }
    }
    return undefined; // we don't support any preferred browser languages
  }

  static _persistLanguagePreference(localeCode) {
    if (!Meteor.user() || Meteor.user().isDemoUser) {
      return;
    }
    if (localeCode === "auto") {
      Meteor.users.update(
        { _id: Meteor.userId() },
        { $unset: { "profile.locale": "" } },
      );
    } else {
      Meteor.users.update(
        { _id: Meteor.userId() },
        { $set: { "profile.locale": localeCode } },
      );
    }
  }
}
