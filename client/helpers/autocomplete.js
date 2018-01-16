import Textarea from '../../node_modules/textcomplete/lib/textarea';
import Textcomplete from '../../node_modules/textcomplete/lib/textcomplete';

const setTextcompleteOptions = (textcomplete) => {
    textcomplete.on('rendered', function () {
        if (textcomplete.dropdown.items.length >= 1) {
            // Activate the first item by default.
            textcomplete.dropdown.items[0].activate();
        }
    });
};

const createStrategy = (id, startCharacter, fetchData, objectToString, objectToStringId) => {
    return {
        id: 'labels',
        match: new RegExp(`(^|\\s)${startCharacter}(\\S*)$`),
        search: function (term, callback) {
            fetchData((data) => {
                const result = data
                    .filter(obj => objectToString(obj).startsWith(term));
                callback(result);
            }, term);
        },
        template: function (obj) {
            return objectToString(obj);
        },
        replace: function (obj) {
            objectToStringId = (objectToStringId) ? objectToStringId : objectToString;
            return `$1${startCharacter}${objectToStringId(obj)} `;
        }
    };
};

export const setupAutocomplete = (element, strategies) => {
    const editor = new Textarea(element);
    const textcomplete = new Textcomplete(editor);
    textcomplete.register(strategies);
    setTextcompleteOptions(textcomplete);
};

export const createLabelStrategy = (fetchData) => {
    return createStrategy('labels', '#', fetchData, (obj) => obj.name);
};

export const createResponsibleStrategy = (fetchData) => {
    return createStrategy('responsibles', '@', fetchData, (obj) => obj.text, (obj) => obj.stringIdentifier);
};