import { Template } from "meteor/templating";
import { $ } from "meteor/jquery";

Template.loading.onRendered(() => {
  $("#loading-content").hide().delay(500).fadeIn("slow");
});
