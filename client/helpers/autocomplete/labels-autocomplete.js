import Textarea from '../../../node_modules/textcomplete/lib/textarea';
import Textcomplete from '../../../node_modules/textcomplete/lib/textcomplete';
import {setTextcompleteOptions} from './autocomplete-config';

export const createStrategy = (availableLabels) => {
    return {
        id: 'labels',
        match: /(^|\s)#(\S*)$/,
        search: function (term, callback) {
            const result = availableLabels
                .map(obj => obj.name)
                .filter(name => name.startsWith(term));
            callback(result);
        },
        template: function (name) {
            return name;
        },
        replace: function (name) {
            return '$1#' + name + ' ';
        }
    }
};

export const setupLabelsAutocomplete = (element, availableLabels) => {
    const editor = new Textarea(element);
    const textcomplete = new Textcomplete(editor);
    textcomplete.register([createStrategy(availableLabels)]);
    setTextcompleteOptions(textcomplete);
};