import Textarea from '../../node_modules/textcomplete/lib/textarea';
import Textcomplete from '../../node_modules/textcomplete/lib/textcomplete';

const setTextcompleteOptions = (textcomplete) => {
    textcomplete.on('rendered', function () {
        if (textcomplete.dropdown.items.length === 1) {
            // Automatically select the only item.
            textcomplete.dropdown.select(textcomplete.dropdown.items[0]);
        } else if (textcomplete.dropdown.items.length > 1) {
            // Activate the first item by default.
            textcomplete.dropdown.items[0].activate();
        }
    });
};

const createStrategy = (id, startCharacter, dataSource, objectToString) => {
    return {
        id: 'labels',
        match: new RegExp(`(^|\\s)${startCharacter}(\\S*)$`),
        search: function (term, callback) {
            const result = dataSource
                .filter(obj => objectToString(obj).startsWith(term));
            callback(result);
        },
        template: function (obj) {
            return objectToString(obj);
        },
        replace: function (obj) {
            return `$1${startCharacter}${objectToString(obj)} `;
        }
    }
};

export const setupAutocomplete = (element, strategies) => {
    const editor = new Textarea(element);
    const textcomplete = new Textcomplete(editor);
    textcomplete.register(strategies);
    setTextcompleteOptions(textcomplete);
};

export const createLabelStrategy = (availableLabels) => {
    return createStrategy('labels', '#', availableLabels, (obj) => obj.name);
};

export const createResponsibleStrategy = (responsibles) => {
    return createStrategy('responsibles', '@', responsibles, (obj) => obj.text);
};