/**
 * Created by felix on 20.05.16.
 */
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

export class BlazeHelper {

    /**
     * Renders a blaze template into a
     * html string.
     *
     * @param template
     * @param data
     * @returns {*}
     */
    static renderTemplateToString(template, data) {
        if (typeof template === 'string') {
            template = Template[template];
        }

        var div = document.createElement('div');
        UI.renderWithData(template, data, div);
        return div.innerHTML;
    }

}