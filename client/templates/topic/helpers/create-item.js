import {ActionItem} from '../../../../imports/actionitem';
import {InfoItem} from '../../../../imports/infoitem';
import {LabelExtractor} from '../../../../imports/services/labelExtractor';
import {Label} from '../../../../imports/label';
import {Priority} from '../../../../imports/priority';
import {ResponsibleExtractor} from '../../../../imports/services/responsibleExtractor';


export function createItem(itemDoc, parentTopic, minutesId, meetingSeries, type = 'infoItem', labels = []) {
    itemDoc.labels = labels.map(labelId => {
        let label = Label.createLabelById(meetingSeries, labelId);
        if (null === label) {
            // we have no such label -> it's brand new
            label = new Label({name: labelId});
            label.save(meetingSeries._id);
        }
        return label.getId();
    });

    if (!itemDoc.createdInMinute) {
        itemDoc.createdInMinute = minutesId;
    }

    if (!itemDoc.subject) {
        throw new Meteor.Error('illegal-argument', 'Please add a subject for the new item');
    }

    let newItem;
    switch (type) {
        case 'actionItem':
            newItem = new ActionItem(parentTopic, itemDoc);
            if (itemDoc.priority) {
                newItem.setPriority(new Priority(itemDoc.priority));
            }
            break;
        case 'infoItem':
        {
            newItem = new InfoItem(parentTopic, itemDoc);
            break;
        }
        default:
            throw new Meteor.Error('Unknown type!');
    }

    const labelExtractor = new LabelExtractor(itemDoc.subject, meetingSeries._id);
    newItem.addLabelsById(labelExtractor.getExtractedLabelIds());
    newItem.setSubject(labelExtractor.getCleanedString());

    return newItem;
}

export function detectTypeAndCreateItem(itemDoc, parentTopic, minutesId, meetingSeries) {
    const responsibleExtractor = new ResponsibleExtractor(itemDoc.subject, true);
    let type = 'infoItem';
    const extractedResponsible = responsibleExtractor.getExtractedResponsible();
    if (extractedResponsible.length > 0) {
        type = 'actionItem';
        itemDoc.responsibles = itemDoc.responsibles || [];
        itemDoc.responsibles = itemDoc.responsibles.concat(extractedResponsible);
        itemDoc.subject = responsibleExtractor.getCleanedString();
    }
    return createItem(itemDoc, parentTopic, minutesId, meetingSeries, type);
}