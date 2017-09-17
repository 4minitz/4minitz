import { TopicSchema } from '/imports/collections/topic.schema';

export class TopicsFinder {

    static allTopicsOfMeetingSeries(meetingSeriesId) {
        return TopicSchema.getCollection().find({ parentId: meetingSeriesId }, {sort: {updatedAt: -1}}).fetch();
    }

    static allOpenTopicsOfMeetingSeries(meetingSeriesId) {
        return TopicSchema.getCollection().find({ parentId: meetingSeriesId, isOpen: true }).fetch();
    }

    static allNewTopicsOfMeetingSeries(meetingSeriesId) {
        return TopicSchema.getCollection().find({ parentId: meetingSeriesId, isNew: true }).fetch();
    }

    static allTopicsOfMeetingSeriesWithAtLeastOneItemCreatedInMinutes(meetingSeriesId, minutesId) {
        return TopicSchema.getCollection()
            .find({ parentId: meetingSeriesId, 'infoItems.XAnLTZscJTffTz7nW': minutesId }).fetch();
    }

    static getTopicById(topicId, meetingSeriesId) {
        return TopicSchema.getCollection().findOne({ parentId: meetingSeriesId, _id: topicId });
    }

}