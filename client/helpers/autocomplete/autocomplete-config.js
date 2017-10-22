

export const setTextcompleteOptions = (textcomplete) => {
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