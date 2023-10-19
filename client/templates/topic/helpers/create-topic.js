import { LabelExtractor } from "../../../../imports/services/labelExtractor";
import { ResponsibleExtractor } from "../../../../imports/services/responsibleExtractor";
import { Topic } from "../../../../imports/topic";

export function createTopic(minutesId, parentSeriesId, topicDoc) {
  topicDoc.responsibles = topicDoc.responsibles || [];
  const responsibleExtractor = new ResponsibleExtractor(topicDoc.subject);
  topicDoc.subject = responsibleExtractor.getCleanedString();
  topicDoc.responsibles = topicDoc.responsibles.concat(
    responsibleExtractor.getExtractedResponsible(),
  );

  const aTopic = new Topic(minutesId, topicDoc);
  const labelExtractor = new LabelExtractor(topicDoc.subject, parentSeriesId);
  aTopic.setSubject(labelExtractor.getCleanedString());
  aTopic.addLabelsByIds(labelExtractor.getExtractedLabelIds());
  return aTopic;
}
