
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'
import { E2EMeetingSeries } from './E2EMeetingSeries'


export class E2EMinutes {
    /**
     * @param aProj
     * @param aName
     * @param aDate format: YYYY-MM-DD is optional!
     */
    static addMinutesToMeetingSeries (aProj, aName, aDate) {
        E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
        browser.waitForVisible("#btnAddMinutes");
        browser.click("#btnAddMinutes");
        E2EGlobal.waitSomeTime(); // give route change time

        if (aDate) {
            browser.waitForVisible('#id_minutesdateInput');
            browser.setValue('#id_minutesdateInput', "");
            browser.setValue('#id_minutesdateInput', aDate);
        }
    };


    static  finalizeCurrentMinutes () {
        browser.waitForVisible("#btn_finalizeMinutes");
        browser.click("#btn_finalizeMinutes");
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
    };
}

