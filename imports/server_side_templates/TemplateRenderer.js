import { Meteor } from 'meteor/meteor';
import { ServerTemplate } from 'meteor/felixble:server-templates'
import { _ } from 'meteor/underscore';

export class TemplateRenderer {

    constructor(template, templatePathPrefix, loadTmplFromAssets) {
        if (!template) {
            throw new Meteor.Error('invalid-argument', 'Parameter template required');
        }
        if (loadTmplFromAssets === undefined) {
            loadTmplFromAssets = true;
        }

        let tmplString;
        if (loadTmplFromAssets) {
            let templatePath = (templatePathPrefix)
                ? templatePathPrefix + "/" + template + ".html"
                : template + ".html";
            tmplString = Assets.getText(templatePath);
        } else {
            tmplString = template;
        }
        this._templateContent = tmplString;
        this._helpers = {};
        this._data = {};

        this.addHelper('markdown2html', function(text) {
            let converter = new Showdown.converter();
            let html = converter.makeHtml(text);
            // remove enclosing p-tag
            if (html.substr(0, 3) === "<p>") {
                html = html.substr(3, html.length - 3);
            }
            return Spacebars.SafeString(html);
        });
    }

    addHelper(name, helper) {
        this._helpers[name] = helper;
        return this;
    }

    addData(name, value) {
        this._data[name] = value;
        return this;
    }

    addDataObject(data) {
        _.extend(this._data, data);
    }

    render() {
        return ServerTemplate.render(this._templateContent, this._data, this._helpers);
    }

}