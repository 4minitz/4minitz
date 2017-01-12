import { expect } from 'meteor/practicalmeteor:chai';
import sinon from 'sinon'

import { TemplateRenderer } from '/imports/server_side_templates/TemplateRenderer'

if (Meteor.isServer) {

    const textFile = 'myTextFile';

    let assetsStub = sinon.stub(Assets, 'getText', function() {
        return textFile;
    });


    describe('TemplateRenderer with SSR', function () {

        let tmplRenderer;

        after(function() {
            assetsStub.restore();
        });

        it('renders template with data correctly', function () {
            const template = 'Hello {{name}}, time: {{time}}';
            const date = new Date();
            const name = '4minitz';


            tmplRenderer = new TemplateRenderer(template, null,/* loadTmplFromAssets */ false);

            let expected = 'Hello ' + name + ', time: ' + date;

            tmplRenderer.addData('name', name);
            tmplRenderer.addHelper('time', () => date);

            expect(tmplRenderer.render()).to.equal(expected);
        });

        it('uses the style template helper to include stylesheet files', function() {
            const template = '{{style style.css}}';
            const expected = `<style>${textFile}</style>`;

            tmplRenderer = new TemplateRenderer(template, null,/* loadTmplFromAssets */ false);

            expect(tmplRenderer.render()).to.equal(expected);
        });

        it('uses the markdown helper correctly', function () {
            template = 'Hello {{markdown2html name}}';
            let expected = 'Hello <strong>Peter</strong><br>\n';
            tmplRenderer = new TemplateRenderer(template, null,/* loadTmplFromAssets */ false);

            tmplRenderer.addData('name', '**Peter**');

            expect(tmplRenderer.render()).to.equal(expected);
        });

        it('uses the doctype helper correctly', function () {
            template = '{{doctype}}';
            let expected = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
            tmplRenderer = new TemplateRenderer(template, null,/* loadTmplFromAssets */ false);

            expect(tmplRenderer.render()).to.equal(expected);
        });

    });
}