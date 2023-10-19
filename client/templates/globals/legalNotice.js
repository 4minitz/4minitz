import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

Template.legalNotice.helpers({
  legalNoticeContent() {
    return Meteor.settings.public.branding.legalNotice.enabled
      ? Meteor.settings.public.branding.legalNotice.content.join(" ")
      : "<b>No legal notice specified.</b><br>You can do so via settings.json key: branding.legalNotice";
  },
});
