import { Meteor } from "meteor/meteor";

import { TemplateRenderer } from "../../imports/server_side_templates/TemplateRenderer";

// Security: ensure that these methods only exist in End2End testing mode
if (Meteor.settings.isEnd2EndTest) {
  // Meteor.settings.isEnd2EndTest will be set via "--settings
  // settings-test-end2end.json"
  console.log(
    "End2End helpers for the serve-templates-API are loaded on server-side!",
  );

  Meteor.methods({
    "e2e-render-template"(template, data) {
      const textFile = "myTextFile";
      const getTextSaved = Assets.getText; // eslint-disable-line
      Assets.getText = () => {
        // eslint-disable-line
        return textFile;
      };

      const date = new Date();
      const tmplRenderer = new TemplateRenderer(
        template,
        null,
        /* loadTmplFromAssets */ false,
      );
      Object.keys(data).forEach((key) => {
        tmplRenderer.addData(key, data[key]);
      });
      tmplRenderer.addHelper("time", () => date);
      const result = tmplRenderer.render();
      Assets.getText = getTextSaved; // eslint-disable-line
      return {
        date,
        textFile,
        result,
      };
    },
  });
}
