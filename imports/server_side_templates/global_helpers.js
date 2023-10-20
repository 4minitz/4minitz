import { Markdown } from "meteor/perak:markdown";
import { Spacebars } from "meteor/spacebars";

export const GlobalHelpers = {
  markdown2html(text = "") {
    text = text.toString();

    let html = `<pre>${text}</pre>`;
    try {
      html = Markdown(text);
    } catch (e) {
      console.log(e);
      console.log("Could not convert markdown to html for:");
      console.log(text);
      throw e;
    }

    // as we embed markdown under a <li> tag in emails we
    // don't want <p> tags to destroy the layout...
    // so we replace "<p>....</p>" to "....<br>"
    html = html.replace(/<p>(.*?)<\/p>/gi, "$1<br>");

    return Spacebars.SafeString(html);
  },

  doctype() {
    const dt =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    return Spacebars.SafeString(dt);
  },

  style(filename) {
    //  Assets cannot be imported!
    const style = Assets.getText(filename); // eslint-disable-line
    return Spacebars.SafeString(`<style>${style}</style>`);
  },
};
