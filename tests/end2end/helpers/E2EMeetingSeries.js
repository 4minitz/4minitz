import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2EMeetingSeries {
    static countMeetingSeries (gotToStartPage = true) {
        if (gotToStartPage) {
            E2EApp.gotoStartPage();
        }
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
            E2EGlobal.clickWithRetry('#btnNewMeetingSeries');  // open
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

        E2EGlobal.clickWithRetry('#btnAddInvite');
        E2EGlobal.waitSomeTime(1000);  // additional time for deferred dialog open + panel switch!

        let meetingSeriesID = browser.getUrl();
        meetingSeriesID = meetingSeriesID.replace(/^.*\//, "");
        meetingSeriesID = meetingSeriesID.replace(/\?.*$/, "");

        if (! keepOpenMSEditor) {
            E2EGlobal.waitSomeTime(2500);  // sporadic e2e Travis failures
            E2EGlobal.saveScreenshot("createMeetingSeries_5");
            E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
            E2EGlobal.saveScreenshot("createMeetingSeries_6");
            E2EGlobal.waitSomeTime(2500);  // sporadic e2e Travis failures
            E2EGlobal.saveScreenshot("createMeetingSeries_7");
            E2EApp.gotoStartPage();
        }

        return meetingSeriesID;
    };


    static getMeetingSeriesId (aProj, aName) {
        return E2EMeetingSeries.doSomethingWithMeetingSeriesListItem(aProj, aName, 'a', (elemId) => {
            let linkTarget = browser.elementIdAttribute(elemId, 'href').value;
            return linkTarget.slice(linkTarget.lastIndexOf("/")+1);
        });
    };

    static doSomethingWithMeetingSeriesListItem(aProj, aName, subElementSelector, something) {
        E2EApp.gotoStartPage();

        try {
            browser.waitForExist('li.meeting-series-item');
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        let compareText = aProj+": "+aName;

        const elements = browser.elements(`li.meeting-series-item ${subElementSelector}`);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText.startsWith(compareText)) {
                return something(elemId);
            }
        }
        return false;
    }

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
            if (visibleText === compareText) {
                browser.execute("arguments[0].scrollIntoView();", elements.value[i]);
                E2EGlobal.waitSomeTime(100);
                browser.elementIdClick(elemId);
                E2EGlobal.waitSomeTime();
                return true;
            }
        }
        throw new Error("Could not find Meeting Series '"+compareText+"'");
    };

    static gotoTabMinutes() {
        let selector = '#tab_minutes';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        E2EGlobal.clickWithRetry(selector);
        E2EGlobal.waitSomeTime();
    }

    static gotoTabTopics() {
        let selector = '#tab_topics';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        E2EGlobal.clickWithRetry(selector);
        E2EGlobal.waitSomeTime();
    }

    static gotoTabItems() {
        let selector = '#tab_items';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        E2EGlobal.clickWithRetry(selector);
        E2EGlobal.waitSomeTime();
    }

    static searchMeetingSeries (query) {
        E2EApp.gotoStartPage();

        if (browser.isVisible('input[id="id_MeetingSeriesSearch"]')) {
           browser.setValue('input[id="id_MeetingSeriesSearch"]', query);
        }
        E2EGlobal.waitSomeTime();
    };

    static visibleMeetingSeriesSearch() {
        return browser.isVisible('input[id="id_MeetingSeriesSearch"]');
    };

    static visibleWarning() {
        return browser.isVisible('span[id="id_noresults"]');
    };
}
