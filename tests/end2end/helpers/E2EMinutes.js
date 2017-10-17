import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'
import { E2EMeetingSeries } from './E2EMeetingSeries'
import {E2EMinutesParticipants} from './E2EMinutesParticipants'


export class E2EMinutes {
    /**
     * @param aProj
     * @param aName
     * @param aDate format: YYYY-MM-DD is optional!
     */
    static addMinutesToMeetingSeries (aProj, aName, aDate) {
        E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        browser.waitForVisible("#btnAddMinutes");
        E2EGlobal.clickWithRetry("#btnAddMinutes");
        E2EGlobal.waitSomeTime(700); // give route change time

        let minutesID = browser.getUrl();
        minutesID = minutesID.replace(/^.*\//, "");

        if (aDate) {
            browser.waitForVisible('#id_minutesdateInput');
            browser.setValue('#id_minutesdateInput', "");
            browser.setValue('#id_minutesdateInput', aDate);
        }
        return minutesID;
    };

    /**
     * Finalizes the current minute
     *
     * @param confirmDialog should the dialog be confirmed automatically
     *                      default: true
     */
    static finalizeCurrentMinutes (confirmDialog) {
        let participantsInfo = new E2EMinutesParticipants();
        participantsInfo.setUserPresence(E2EApp.getCurrentUser(),true);
        browser.waitForVisible("#btn_finalizeMinutes");
        E2EGlobal.clickWithRetry("#btn_finalizeMinutes");

        E2EMinutes.confirmQualityAssuranceDialog();

        if (E2EGlobal.SETTINGS.email && E2EGlobal.SETTINGS.email.enableMailDelivery) {
            if (confirmDialog === undefined || confirmDialog) {
                E2EApp.confirmationDialogAnswer(true);
            }
        }
        E2EGlobal.waitSomeTime(1000);
    };

    /**
     * Finalizes the current minute, when no participants present
     *
     * @param confirmDialog should the dialog be confirmed automatically
     *                      default: true
     *        processFinalize is true, when you want to proceed finalizing Minutes without participants
     */
    static finalizeCurrentMinutesWithoutParticipants (confirmDialog, processFinalize) {
        browser.waitForVisible("#btn_finalizeMinutes");
        E2EGlobal.clickWithRetry("#btn_finalizeMinutes");

        E2EMinutes.confirmQualityAssuranceDialog();
        if(processFinalize == true) {
            browser.waitForVisible("#confirmationDialogOK");
            E2EGlobal.clickWithRetry("#confirmationDialogOK");
            if (E2EGlobal.SETTINGS.email && E2EGlobal.SETTINGS.email.enableMailDelivery) {
                if (confirmDialog === undefined || confirmDialog) {
                    E2EApp.confirmationDialogAnswer(true);
                }
            }
            E2EGlobal.waitSomeTime(1000);
        }
        else {
            browser.waitForVisible("#confirmationDialogCancel");
            E2EGlobal.clickWithRetry("#confirmationDialogCancel");
        }
    };

    static confirmQualityAssuranceDialog(){
        E2EGlobal.waitSomeTime();
        if(browser.isVisible('#minuteQualityAssuranceDialog')) {
            E2EApp.confirmationDialogAnswer(true);
        }
    }

    static  unfinalizeCurrentMinutes () {
        browser.waitForVisible('#btn_unfinalizeMinutes');
        E2EGlobal.clickWithRetry('#btn_unfinalizeMinutes');
    };


    static countMinutesForSeries (aProj, aName) {
        let selector = 'a#id_linkToMinutes';
        E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return 0;   // we have no minutes series <li> => "zero" result
        }
        const elements = browser.elements(selector);
        return elements.value.length;
    };


    static getMinutesId (aDate) {
        let selector = 'a#id_linkToMinutes';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }

        const elements = browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText == aDate) {
                let linkTarget = browser.elementIdAttribute(elemId, 'href').value;
                return linkTarget.slice(linkTarget.lastIndexOf("/")+1);
            }
        }
        return false;
    };

    static getCurrentMinutesDate() {
        browser.waitForVisible('#id_minutesdateInput');
        return browser.getValue('#id_minutesdateInput');
    }

    static getCurrentMinutesId() {
        let url = browser.getUrl();
        return url.slice(url.lastIndexOf("/")+1);
    }


    static  gotoMinutes (aDate) {
        let selector = 'a#id_linkToMinutes';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;   // we have no meeting series at all!
        }

        const elements = browser.elements(selector);

        for (let i in elements.value) {
            let elemId = elements.value[i].ELEMENT;
            let visibleText = browser.elementIdText(elemId).value;
            if (visibleText == aDate) {
                browser.elementIdClick(elemId);
                E2EGlobal.waitSomeTime();
                return true;
            }
        }
        throw new Error("Could not find Minutes '"+aDate+"'");
    };

    static gotoLatestMinutes () {
        let selector = 'a#id_linkToMinutes';

        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;
        }

        const elements = browser.elements(selector);
        const firstElementId = elements.value[0].ELEMENT;

        browser.elementIdClick(firstElementId);
        E2EGlobal.waitSomeTime();
    };

    static gotoParentMeetingSeries () {
        let selector = 'a#id_linkToParentSeries'
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return false;
        }
        E2EGlobal.clickWithRetry(selector);
        E2EGlobal.waitSomeTime();
    }
}

