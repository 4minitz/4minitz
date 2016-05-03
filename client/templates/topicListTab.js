

var collapseID = 0;


Template.topicListTab.onRendered(function () {
    $.material.init();
});


Template.topicListTab.helpers({

    getTopicItem: function () {
        return {
            topic: this,
            isEditable:  false,
            minutesID: false,
            currentCollapseId: collapseID++  // each topic item gets its own collapseID
        };
    }

});
