import { Meteor } from 'meteor/meteor';
import { ServerTemplate } from 'meteor/felixble:server-templates'
import { _ } from 'meteor/underscore';
import { GlobalHelpers } from './global_helpers'

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
        this._helpers = GlobalHelpers;
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

    addDataObject(data) {
        _.extend(this._data, data);
    }

    render() {
        return ServerTemplate.render(this._templateContent, this._data, this._helpers);
    }

}