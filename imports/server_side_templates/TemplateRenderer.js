import { Meteor } from 'meteor/meteor';
import { SSR, Template } from 'meteor/meteorhacks:ssr'

export class TemplateRenderer {

    static getID() {
        if (!TemplateRenderer.ID) {
            TemplateRenderer.ID = 0
        }

        return TemplateRenderer.ID++;
    }

    constructor(template, templatePathPrefix) {
        if (!template) {
            throw new Meteor.Error('invalid-argument', 'Parameter template required');
        }
        let templatePath = (templatePathPrefix)
            ? templatePathPrefix + "/" + template + ".html"
            : template + ".html";
        this._templateName = template;
        SSR.compileTemplate(this._templateName, Assets.getText(templatePath));
        this._helpers = {};
        this._data = {};
    }

    addHelper(name, helper) {
        this._helpers[name] = helper;
        return this;
    }

    addData(name, value) {
        this._data[name] = value;
        return this;
    }

    render() {
        Template[this._templateName].helpers(this._helpers);

        return SSR.render(this._templateName, this._data);
    }

}