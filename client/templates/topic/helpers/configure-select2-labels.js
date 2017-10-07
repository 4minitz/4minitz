import {Minutes} from '../../../../imports/minutes';

export const configureSelect2Labels = (minutesId, elementSelector, editItem) => {
    const aMin = new Minutes(minutesId);
    const aSeries = aMin.parentMeetingSeries();

    const selectLabels = $(elementSelector);
    selectLabels.find('option')     // clear all <option>s
        .remove();

    const selectOptions = [];

    aSeries.getAvailableLabels().forEach(label => {
        selectOptions.push ({id: label._id, text: label.name});
    });

    selectLabels.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        data: selectOptions             // push <option>s data
    });


    // select the options that where stored with this topic last time
    if (editItem) {
        selectLabels.val(editItem.getLabelsRawArray());
    }
    selectLabels.trigger('change');
};