import { I18nHelper } from "/imports/helpers/i18n";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";

const supportedLocales = new ReactiveVar([]);

Template.localeDialog.onCreated(() => {
  Meteor.call("getAvailableLocales", (error, result) => {
    if (error) {
      console.log("Error: No supported language locales reported by server.");
    } else {
      supportedLocales.set(result);
    }
  });
});

Template.localeDialog.helpers({
  supportedLocales() {
    return supportedLocales.get();
  },
});

Template.localeDialog.events({
  "submit #frmDlgSetLocale"(evt, tmpl) {
    evt.preventDefault();

    const newLoc = tmpl.find("#selLocale").value;
    I18nHelper.setLanguageLocale(newLoc);
    tmpl.$("#dlgLocale").modal("hide");
  },

  "show.bs.modal #dlgLocale": function (evt, tmpl) {
    // preselect the current locale, if user is logged in
    let locID = `#loc-${I18nHelper.getLanguageLocale()}`; // might be 'en-US'
    const select = tmpl.find(locID);
    if (select) {
      select.selected = true;
    } else {
      locID = `#loc-${I18nHelper.getLanguageLocale().substr(0, 2)}`; // fallback: try 'en'
      const select = tmpl.find(locID);
      if (select) {
        select.selected = true;
      } else {
        console.log(`Could not find select option: >${locID}<`);
      }
    }
  },
});
