import { expect } from 'meteor/practicalmeteor:chai';

import { TemplateRenderer } from '/imports/server_side_templates/TemplateRenderer'

if (Meteor.isServer) {
    describe('TemplateRenderer with SSR', function () {
        const template = 'Hello {{name}}, time: {{time}}';
        const date = new Date();
        const name = '4minitz';

        let tmplRenderer;

        beforeEach(function () {
            tmplRenderer = new TemplateRenderer(template, null,/* loadTmplFromAssets */ false);
        });

        it('renders template with data correctly', function () {
            let expected = 'Hello ' + name + ', time: ' + date;

            tmplRenderer.addData('name', name);
            tmplRenderer.addHelper('time', () => date);

            expect(tmplRenderer.render()).to.equal(expected);
        });

    });
}