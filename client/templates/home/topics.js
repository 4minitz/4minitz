
Template.topics.created = function () {
};

Template.topics.rendered = function () {
    $('.collapsible').collapsible();
};

Template.topics.helpers({
    detailsArray: function () {
        return this.details;
    },

    topicColor: function () {
        if (this.state === "open") {
            return "teal lighten-3";
        } else {
            return "grey lighten-1";
        }
    }
});

Template.topics.events({
    //add your events here
});
