import { E2EGlobal } from './E2EGlobal';
import { E2EApp } from './E2EApp';


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
        return elements.length;
    }


    static editMeetingSeriesForm (aProj, aName, switchInput) {
        E2EApp.gotoStartPage();

        // is "create MeetingSeries dialog" closed?
        E2EGlobal.saveScreenshot('001');
        if (!browser.isVisible('input[id="id_meetingproject"]')) {
            E2EGlobal.saveScreenshot('002');
            E2EGlobal.clickWithRetry('#btnNewMeetingSeries');  // open
            E2EGlobal.saveScreenshot('003');
            E2EGlobal.waitSomeTime(600);
            E2EGlobal.saveScreenshot('004');
            browser.waitForVisible('input[id="id_meetingproject"]');
            E2EGlobal.saveScreenshot('005');
        }

        if (switchInput) {
            browser.setValue('input[id="id_meetingname"]', aName);
            browser.setValue('input[id="id_meetingproject"]', aProj);
        } else {
            browser.setValue('input[id="id_meetingproject"]', aProj);
            browser.setValue('input[id="id_meetingname"]', aName);
        }
    }

    static createMeetingSeries (aProj, aName, keepOpenMSEditor, switchInput) {
        this.editMeetingSeriesForm(aProj, aName,  switchInput);
        E2EGlobal.waitSomeTime();

        E2EGlobal.clickWithRetry('#btnAddInvite');
        E2EGlobal.logTimestamp('will open MS Editor');
        try {
            browser.waitForVisible('#btnMeetinSeriesEditCancel', 5000); // will check every 500ms
            E2EGlobal.logTimestamp('is open: MS Editor');
        } catch (e) {
            E2EGlobal.logTimestamp('could not open: MS Editor');
            if (keepOpenMSEditor) {
                throw e;
            }
        }
        E2EGlobal.waitSomeTime(1000);  // additional time for panel switch!
        let meetingSeriesID = browser.getUrl();
        meetingSeriesID = meetingSeriesID.replace(/^.*\//, '');
        meetingSeriesID = meetingSeriesID.replace(/\?.*$/, '');

        if (! keepOpenMSEditor) {
            if (browser.isVisible('#btnMeetinSeriesEditCancel')) {
                E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
                // browser.waitForVisible('#btnMeetinSeriesEditCancel', 4000, true); // will check for IN-VISIBLE!
            } else {
                // if for miracoulous reasons the MS editor is already gone - we will try to continue...
                E2EGlobal.logTimestamp('MS Editor is closed by miracle. Continue.');
            }
            E2EApp.gotoStartPage();
        }
        return meetingSeriesID;
    }


    static getMeetingSeriesId (aProj, aName) {
        const link = $('='+aProj+': '+aName);
        let linkTarget = link.getAttribute('href');
        return linkTarget.slice(linkTarget.lastIndexOf('/')+1);
    }

    static gotoMeetingSeries (aProj, aName) {
        E2EApp.gotoStartPage();
        E2EGlobal.waitSomeTime();

        let selector = 'li.meeting-series-item a';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }
        let compareText = aProj+': '+aName;

        const elements = browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText === compareText) {
                browser.execute('arguments[0].scrollIntoView();', elements.value[i]);
                E2EGlobal.waitSomeTime(100);
                browser.elementIdClick(elemId);
                E2EGlobal.waitSomeTime(500);
                let currentURL = browser.getUrl();
                if (!currentURL.includes('meetingseries')) {
                    throw new Error('Could not switch to Meeting Series \''+compareText+'\'');
                }
                return true;
            }
        }
        throw new Error('Could not find Meeting Series \''+compareText+'\'');
    }

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
    }

    static visibleMeetingSeriesSearch() {
        return browser.isVisible('input[id="id_MeetingSeriesSearch"]');
    }

    static visibleWarning() {
        return browser.isVisible('span[id="id_noresults"]');
    }
}
