
Template.topics.onCreated(function () {
});

Template.topics.onRendered(function () {
});

var collapseID = 0;
Template.topics.helpers({
    detailsArray: function () {
        return this.details;
    },

    // generate 1-1, 2-2, 3-3,... pairs to link headings with their collapsible details
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
