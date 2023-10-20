import { Template } from "meteor/templating";
import { GlobalSettings } from "/imports/config/GlobalSettings";

Template.appLayout.helpers({
  showGitHubCorner() {
    return GlobalSettings.showGithubCorner();
  },
});
