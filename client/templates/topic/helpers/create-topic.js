import {Topic} from '../../../../imports/topic';
import {LabelExtractor} from '../../../../imports/services/labelExtractor';

export function createTopic(minutesId, parentSeriesId, topicDoc) {
    const aTopic = new Topic(minutesId, topicDoc);
    const labelExtractor = new LabelExtractor(topicDoc.subject, parentSeriesId);
    aTopic.setSubject(labelExtractor.getCleanedString());
    aTopic.addLabelsByIds(labelExtractor.getExtractedLabelIds());
    aTopic.extractResponsiblesFromTopic();
    return aTopic;
}