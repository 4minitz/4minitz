
var _meeting;   // the parent meeting of this minutes

Template.minutesadd.created = function () {
    _meeting = this.data;
};

Template.minutesadd.onRendered(function () {
    // Initialize the datepicker control
    $('.datepicker').pickadate({  // for all datepicker options see: http://amsul.ca/pickadate.js/date/
        format: 'yyyy-mm-dd'
    });
});

Template.minutesadd.helpers({
    meeting: function() {
        return _meeting;
    },

    currentDate: function() {
        return new Date();
    },

    topicsArray: function () {
        return [
            {
                subject: "Planung Iteration #2",
                responsible: "WOK",
                priority: 2,
                duedate: "2015-04-02",
                state: "open",
                details: [  { date: "2015-03-02",
                    text: "lorem ipsum details 2"
                },
                    { date: "2015-03-01",
                        text: "lorem ipsum details 1"
                    }
                ]  // end-of details
            } // end-of topic
            ,
            {
                subject: "Diskussion Datenmodell",
                responsible: "@all",
                priority: 1,
                duedate: "2015-04-02",
                state: "open",
                details: [  { date: "2015-03-02",
                    text: "lorem ipsum details 22"
                },
                    { date: "2015-03-01",
                        text: "lorem ipsum details 11"
                    }
                ]  // end-of details
            } // end-of topic
            ,
            {
                subject: "Einführung Testframework",
                responsible: "@all",
                priority: 1,
                duedate: "2015-04-05",
                state: "closed",
                details: [  { date: "2015-01-02",
                    text: "lorem ipsum details 222"
                },
                    { date: "2015-01-01",
                        text: "lorem ipsum details 111"
                    }
                ]  // end-of details
            } // end-of topic
        ];
    }
});

Template.minutesadd.events({
    "click #btnSave": function (evt, template) {
        console.log("Saving Minutes...");
        aDate = template.find("#id_date").value;
        theParticipants = template.find("#id_participants").value;
        aText = template.find("#id_text").value;
        if (aDate == "" || theParticipants == "" || aText == "") {
            return;
        }

        Meteor.call("addMinutes", _meeting._id, aDate, theParticipants, aText);
    }
});
