import { E2EApp } from './helpers/E2EApp';
import {E2EGlobal} from "./helpers/E2EGlobal";

describe('TemplateRendererIntegration', function () {

    before("reload page and reset app", function () {
        E2EGlobal.logTimestamp("Start test suite");
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('renders template with data correctlys', function () {
        const template = 'Hello {{name}}, time: {{time}}';
        const name = '4minitz';
        const response = server.call('e2e-render-template', template, {name: name});
        const expected = 'Hello ' + name + ', time: ' + response.date;
        expect(response.result).to.equal(expected);
    });

    it('uses the style template helper to include stylesheet files', function() {
        const template = '{{style style.css}}';
        const response = server.call('e2e-render-template', template, {});
        const expected = `<style>${response.textFile}</style>`;
        expect(response.result).to.equal(expected);
    });

    it('uses the markdown helper correctly', function () {
        const template = 'Hello {{markdown2html name}}';
        let expected = 'Hello <strong>Peter</strong><br>\n';
        const response = server.call('e2e-render-template', template, {name: '**Peter**'});
        expect(response.result).to.equal(expected);
    });

    it('uses the doctype helper correctly', function () {
        const template = '{{doctype}}';
        let expected = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
        const response = server.call('e2e-render-template', template, {});
        expect(response.result).to.equal(expected);
    });

});
