import { Meteor } from 'meteor/meteor';
import { SSR, Template } from 'meteor/meteorhacks:ssr'
import { _ } from 'meteor/underscore';

export class TemplateRenderer {

    static getID() {
        if (!TemplateRenderer.ID) {
            TemplateRenderer.ID = 0
        }

        return TemplateRenderer.ID++;
    }

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
            this._templateName = template;
            tmplString = Assets.getText(templatePath);
        } else {
            tmplString = template;
            this._templateName = 'ssrTemplate' + TemplateRenderer.getID();
        }
        SSR.compileTemplate(this._templateName, tmplString);
        this._helpers = {};
        this._data = {};

        this.addHelper('markdown2html', function(text) {
            let converter = new Showdown.converter();
            let html = converter.makeHtml(text);
            // remove enclosing p-tag
            if (html.substr(0, 3) === "<p>") {
                html = html.substr(3, html.length - 4);
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
        Template[this._templateName].helpers(this._helpers);

        return SSR.render(this._templateName, this._data);
    }

}