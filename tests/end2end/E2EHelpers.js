
let settings = require('../../settings-test-end2end.json');


let waitSomeTime = function (milliseconds) {
    if (!milliseconds) {
        milliseconds = 500;
    }
    browser.pause(milliseconds);
} ;


let formatDateISO8601 = function (aDate) {
    var dd = aDate.getDate();
    var mm = aDate.getMonth()+1; //January is 0!
    var yyyy = aDate.getFullYear();
    if(dd<10){
        dd='0'+dd
    }
    if(mm<10){
        mm='0'+mm
    }
    return yyyy+"-"+mm+"-"+dd;
};

// Calls the server method to clean database and create fresh test users
let resetMyApp = function () {
    try {
        server.call('e2e.resetMyApp');  // call meteor server method
    } catch (e) {
        console.log("Exception: "+e);
        console.log("Did you forget to run the server with '--settings settings-test-end2end.json'?");
    }
};


let isLoggedIn = function () {
    try {
        browser.waitForExist('#navbar-signout', 1000);         // browser = WebdriverIO instance
    } catch (e) {
        // give browser some time, on fresh login
    }
    return browser.isExisting('#navbar-signout');
};


let logoutUser = function () {
    if (isLoggedIn()) {
        browser.click('#navbar-signout')
    }
};


/**
 * Logout current user, if necessary, then login a specific test user 
 * @param index of test user from setting. optional.
 */
let loginUser = function (index) {
    if (!index) {
        index = 0;
    }
    let aUser = settings.e2eTestUsers[index];
    let aPassword = settings.e2eTestPasswords[index];

    logoutUser();
    try {    // try to log in
        if (browser.isExisting('#at-field-username_and_email')) {
            browser.setValue('input[id="at-field-username_and_email"]', aUser);
            browser.setValue('input[id="at-field-password"]', aPassword);
            browser.keys(['Enter']);

            if (browser.isExisting('.at-error.alert.alert-danger')) {
                throw new Error ("Unknown user or wrong password.")
            }
        }
    } catch (e) {
        throw new Error ("Login failed for user "+aUser + " with "+aPassword+"\nwith "+e);
    }
};


let launchApp = function () {
    browser.url(settings.e2eUrl);

    if (browser.getTitle() != "4minitz!") {
        throw new Error("App not loaded. Unexpected title "+browser.getTitle()+". Please run app with 'meteor npm run test:end2end:server'")
    }
};


let isOnStartPage = function () {
    // post-condition
    try {
        browser.waitForExist('#btnNewMeetingSeries', 2000);
    } catch (e) {
        return false;
    }
    return true;
};


// We can't use "launchApp" here, as this resets the browser
// so we click on the "Logo" icon
let gotoStartPage = function () {
    browser.click('a.navbar-brand');

    // check post-condition
    expect (isOnStartPage()).to.be.true;
};

let countMeetingSeries = function() {
    gotoStartPage();
    try {
        browser.waitForExist('li.meeting-series-item');
    } catch (e) {
        return 0;   // we have no meeting series <li> => "zero" result
    }
    const elements = browser.elements('li.meeting-series-item');
    return elements.value.length;
};


let confirmationDialogAnswer = function (pressOK) {
    waitSomeTime(750); // give dialog animation time
    browser.waitForVisible('#confirmationDialogOK', 1000);
    if (pressOK) {
        browser.click("#confirmationDialogOK");
    } else {
        browser.click("#confirmationDialogCancel");
    }
    waitSomeTime(750); // give dialog animation time
};


let createMeetingSeries = function (aProj, aName) {
    gotoStartPage();

    // is "create MeetingSeries dialog" closed?
    if (! browser.isVisible('input[id="id_meetingproject"]')) {
        browser.click('#btnNewMeetingSeries');  // open
        waitSomeTime();
        browser.waitForVisible('input[id="id_meetingproject"]');
    }

    browser.setValue('input[id="id_meetingproject"]', aProj);
    browser.setValue('input[id="id_meetingname"]', aName);
    browser.click('#btnAdd');

    waitSomeTime();
    browser.click('#btnNewMeetingSeries');  // close dialog
    waitSomeTime(); // give time for close-animation
};


let getMeetingSeriesId = function (aProj, aName) {
    gotoStartPage();

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


let gotoMeetingSeries = function (aProj, aName) {
    gotoStartPage();

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
            return true;
        }
    }
    throw new Error("Could not find Meeting Series '"+compareText+"'");
};


let openMeetingSeriesEditor = function (aProj, aName) {
    gotoMeetingSeries(aProj, aName);

    // Open dialog
    browser.waitForVisible('#btnEditMeetingSeries', 1000);
    browser.click('#btnEditMeetingSeries');
    waitSomeTime(750); // give dialog animation time
    // Check if dialog is there?
    browser.waitForVisible('#btnMeetingSeriesSave', 1000);
};

/**
 * 
 * @param aProj
 * @param aName
 * @param aDate is optional!
 */
let addMinutesToMeetingSeries = function (aProj, aName, aDate) {
    gotoMeetingSeries(aProj, aName);
    browser.waitForVisible("#btnAddMinutes");
    browser.click("#btnAddMinutes");
    waitSomeTime(); // give route change time
    
    if (aDate) {
        browser.waitForVisible('#id_minutesdateInput');
        browser.setValue('#id_minutesdateInput', "");
        browser.setValue('#id_minutesdateInput', aDate);
    }
};


let finalizeCurrentMinutes = function () {
    browser.waitForVisible("#btn_finalizeMinutes");
    browser.click("#btn_finalizeMinutes");
};


let countMinutesForSeries = function(aProj, aName) {
    let selector = 'a#id_linkToMinutes';
    gotoMeetingSeries(aProj, aName);
    try {
        browser.waitForExist(selector);
    } catch (e) {
        return 0;   // we have no minutes series <li> => "zero" result
    }
    const elements = browser.elements(selector);
    return elements.value.length;
};


let getMinutesId = function (aDate) {
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


let gotoMinutes = function (aDate) {
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

let gotoLatestMinutes = function () {
    let selector = 'a#id_linkToMinutes';

    try {
        browser.waitForExist(selector);
    } catch (e) {
        return false;
    }

    const elements = browser.elements(selector);
    const firstElementId = elements.value[0].ELEMENT;

    browser.elementIdClick(firstElementId);

    throw new Error("Could not find any Minutes");
};

let addTopicToMinutes = function (aTopic) {
    browser.waitForVisible("#id_showAddTopicDialog");
    browser.click("#id_showAddTopicDialog");

    try {
        browser.waitForVisible('#id_subject');
    } catch (e) {
        return false;
    }
    waitSomeTime();

    browser.setValue('#id_subject', aTopic);
    browser.click("#btnTopicSave");
    waitSomeTime();
};

let getTopicsForMinute = function () {
    let selector = '#accordion > div.well';
    try {
        browser.waitForExist(selector);
    } catch (e) {
        return 0;
    }
    const elements = browser.elements(selector);
    return elements.value;
};

let countTopicsForMinute = function() {
    var topics = getTopicsForMinute();
    
    return topics.length;
};


// ************* EXPORTS ****************
module.exports.settings = settings;
module.exports.resetMyApp = resetMyApp;
module.exports.waitSomeTime = waitSomeTime;
module.exports.formatDateISO8601 = formatDateISO8601;
module.exports.isLoggedIn = isLoggedIn;
module.exports.loginUser = loginUser;
module.exports.logoutUser = logoutUser;
module.exports.launchApp = launchApp;
module.exports.gotoStartPage = gotoStartPage;
module.exports.isOnStartPage = isOnStartPage;
module.exports.confirmationDialogAnswer = confirmationDialogAnswer;

module.exports.createMeetingSeries = createMeetingSeries;
module.exports.countMeetingSeries = countMeetingSeries;
module.exports.getMeetingSeriesId = getMeetingSeriesId;
module.exports.gotoMeetingSeries = gotoMeetingSeries;
module.exports.openMeetingSeriesEditor  = openMeetingSeriesEditor ;

module.exports.addMinutesToMeetingSeries = addMinutesToMeetingSeries;
module.exports.gotoMinutes = gotoMinutes;
module.exports.finalizeCurrentMinutes = finalizeCurrentMinutes;
module.exports.getMinutesId = getMinutesId;
module.exports.countMinutesForSeries = countMinutesForSeries;
module.exports.addTopicToMinutes = addTopicToMinutes;
module.exports.gotoLatestMinutes = gotoLatestMinutes;
module.exports.getTopicsForMinute = getTopicsForMinute;
module.exports.countTopicsForMinute = countTopicsForMinute;