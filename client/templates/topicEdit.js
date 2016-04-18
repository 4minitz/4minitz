import { Minutes } from '/imports/minutes'

let _minutesID; // the ID of these minutes

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicEdit.onRendered(function () {
    this.$('#id_duedatePicker').datetimepicker(
        {
            format: "YYYY-MM-DD"
        }
    );
});

Template.topicEdit.onDestroyed(function () {
    //add your statement here
});

Template.topicEdit.helpers({
    //add you helpers here
});

Template.topicEdit.events({
    "click #btnTopicSave": function (evt, tmpl) {
        evt.preventDefault();
        var aSubject = tmpl.find("#id_subject").value;
        var aPriority = tmpl.find("#id_priority").value;
        var aResponsible = tmpl.find("#id_responsible").value;
        var aDuedate = tmpl.find("#id_duedateInput").value;
        var aDetails = tmpl.find("#id_details").value;
        let subjectNode = tmpl.$("#id_subject");

        // validate form and show errors
        subjectNode.parent().removeClass("has-error");
        if (aSubject == "") {
            subjectNode.parent().addClass("has-error");
            subjectNode.focus();
            return;
        }

        let aMin = new Minutes(_minutesID);
        if (aMin) {
            let aDate = formatDateISO8601(new Date());
            var topic =                             // TODO: Use to-be-created Topic class for this!
            {
                _id: Random.id(),   // create our own local _id here!
                subject: aSubject,
                responsible: aResponsible,
                priority: aPriority,
                duedate: aDuedate,
                state: "open",
                details: [{
                    date: aDate,
                    text: aDetails
                }]  // end-of details
            }; // end-of topic

            var topics = aMin.topics;
            topics.unshift(topic);  // add to front of array
            aMin.update({topics: topics});
        }
        // Hide modal dialog
        $('#dlgAddTopic').modal('hide')
    },

    "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        tmpl.find("#id_duedateInput").value = currentDatePlusDeltaDays(7);
        tmpl.find("#id_subject").focus();
    }
});
