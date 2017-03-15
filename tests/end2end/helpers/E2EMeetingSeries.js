
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2EMeetingSeries {
    static countMeetingSeries () {
        E2EApp.gotoStartPage();
        try {
            browser.waitForExist('li.meeting-series-item');
        } catch (e) {
            return 0;   // we have no meeting series <li> => "zero" result
        }
        const elements = browser.elements('li.meeting-series-item');
        return elements.value.length;
    };


    static editMeetingSeriesForm (aProj, aName, switchInput) {
        E2EApp.gotoStartPage();

        // is "create MeetingSeries dialog" closed?
        if (!browser.isVisible('input[id="id_meetingproject"]')) {
            browser.click('#btnNewMeetingSeries');  // open
            E2EGlobal.waitSomeTime();
            browser.waitForVisible('input[id="id_meetingproject"]');
        }

        if (switchInput) {
            browser.setValue('input[id="id_meetingname"]', aName);
            browser.setValue('input[id="id_meetingproject"]', aProj);
        } else {
            browser.setValue('input[id="id_meetingproject"]', aProj);
            browser.setValue('input[id="id_meetingname"]', aName);
        }
    };

    static createMeetingSeries (aProj, aName, keepOpenMSEditor, switchInput) {
        this.editMeetingSeriesForm(aProj, aName,  switchInput);
        E2EGlobal.waitSomeTime();

        browser.click('#btnAddInvite');
        E2EGlobal.waitSomeTime(500);  // double time for dialog + panel switch!

        let meetingSeriesID = browser.getUrl();
        meetingSeriesID = meetingSeriesID.replace(/^.*\//, "");
        meetingSeriesID = meetingSeriesID.replace(/\?.*$/, "");

        if (! keepOpenMSEditor && browser.isVisible("#btnMeetinSeriesEditCancel")) {
            browser.click('#btnMeetinSeriesEditCancel');
            E2EGlobal.waitSomeTime();
            E2EApp.gotoStartPage();
        }
        return meetingSeriesID;
    };


    static getMeetingSeriesId (aProj, aName) {
        E2EApp.gotoStartPage();

        try {
            browser.waitForExist('li.meeting-series-item');
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        let compareText = aProj+": "+aName;

        const elements = browser.elements('li.meeting-series-item a');

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText == compareText) {
                let linkTarget = browser.elementIdAttribute(elemId, 'href').value;
                return linkTarget.slice(linkTarget.lastIndexOf("/")+1);
            }
        }
        return false;
    };


    static gotoMeetingSeries (aProj, aName) {
        E2EApp.gotoStartPage();

        let selector = 'li.meeting-series-item a';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        let compareText = aProj+": "+aName;

        const elements = browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText == compareText) {
                browser.elementIdClick(elemId);
                E2EGlobal.waitSomeTime();
                return true;
            }
        }
        throw new Error("Could not find Meeting Series '"+compareText+"'");
    };

    static gotoTabTopics() {
        let selector = '#tab_topics';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        browser.click(selector);
        E2EGlobal.waitSomeTime();
    }

    static gotoTabItems() {
        let selector = '#tab_items';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        browser.click(selector);
        E2EGlobal.waitSomeTime();
    }
}
