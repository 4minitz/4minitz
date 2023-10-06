
export const updateTopicsOfMinutes = (minutes, minutesCollection, options = {}) => {
    // We switch off bypassCollection2 here, to skip .clean & .validate to allow empty string values
    minutesCollection.update(
        minutes._id, {
            $set: {
                'topics': minutes.topics,
            }
        },
        options
    );
};
