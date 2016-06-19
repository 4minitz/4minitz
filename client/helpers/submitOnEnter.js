import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

function createHandler(action, ignoreCtrl) {
    return (event) => {
        event.preventDefault();

        let ctrl = ignoreCtrl || event.ctrlKey;
        let enterWasPressed = event.key == 'Enter';

        // for browsers that do not support event.key yet
        enterWasPressed |= event.keyCode == 13;

        if (ctrl && enterWasPressed) {
            action();
        }
    };
}

function attachHandler(inputs, ignoreCtrl, action) {
    _.each(inputs, (input) => {
        $(input).on('keyup', createHandler(action, ignoreCtrl));
    });
}

export default function (edits, textareas, action) {
    attachHandler(edits, true, action);
    attachHandler(textareas, false, action);
};