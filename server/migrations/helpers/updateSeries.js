
export const updateTopicsOfSeriesPre16 = (series, meetingSeriesCollection, options = {}) => {
    meetingSeriesCollection.update(
        series._id, {
            $set: {
                'topics': series.topics,
                'openTopics': series.openTopics
            }
        },
        options
    );
};
