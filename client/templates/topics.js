
Template.topics.created = function () {
};

Template.topics.rendered = function () {
};

var collapseID = 0;
Template.topics.helpers({
    detailsArray: function () {
        return this.details;
    },

    currentCollapseID: function () {
        cID = collapseID;
        collapseID ++;
        return Math.floor(cID / 2);
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
