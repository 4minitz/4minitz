"use strict";

let mongo = require('mongodb').MongoClient,
    random = require('randomstring'),
    faker = require('faker'),
    fs = require('fs'),
    optionParser = require('node-getopt').create([
        ['c', 'customize=[ARG]', 'file to customize the data generation process'],
        ['m', 'mongourl=[ARG]', 'Mongo DB url'],
        ['h', 'help', 'Display this help']
    ]);

let arg = optionParser.bindHelp().parseSystem();

// check preconditions
// we need a mongo url, first check environment variables, then
// parameters and if neither provides a url, exit with an error

let mongoUrl = arg.options.mongourl || process.env.MONGO_URL;

if (!mongoUrl) {
    optionParser.showHelp();
    console.error('No mongo url found in env or given as parameter.');

    process.exit(1);
}


const customizeFile = arg.options.customize;

let formatDateISO8601 = function (aDate) {
    let isoString = "";
    aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); //removing the timezone offset.
    try {
        isoString = aDate.toISOString().substr(0,10);   // YYYY-MM-DD
    } catch (e) {
        isoString = "NaN-NaN-NaN";
    }
    return isoString;
};

let generateId = function() {
    // unique id from the random package also used by minimongo
    // character list: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L88
    // string length: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L197
    const randomStringConfig = {
        length: 17,
        charset: '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz'
    };
    return random.generate(randomStringConfig);
};

let readSettingsFile = function (filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
            if (error) {
                reject(`Could not read file "${filename}"`);
            } else {
                resolve(data);
            }
        });
    });
};

let parseJSON = function (json) {
    return new Promise((resolve, reject) => {
        try {
            let data = JSON.parse(json);
            resolve(data);
        } catch (error) {
            reject('Could not parse json.');
        }
    });
};

let readSettings = function(filename) {
    return new Promise((resolve, reject) => {
        readSettingsFile(filename)
            .then(parseJSON)
            .then(config => {
                if (!config.meetingName) {
                    config.meetingName = faker.name.findName();
                    resolve(config);
                }
            })
            .catch(reject)
    });
};

let connectMongo = function (mongoUrl, data) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongoUrl, (error, db) => {
            if (error) {
                reject(error);
            }
            data.db = db;
            resolve(data);
        });
    });
};

let closeMongo = function (data) {
    let force = true,
        db = data.db;
    delete data.db;

    return new Promise((resolve) => {
        db.close(force);
        resolve(data);
    });
};

let nextMinutesDate = new Date();
let getNextMinutesDate = function() {
    nextMinutesDate.setDate(nextMinutesDate.getDate() + 1);
    return formatDateISO8601(nextMinutesDate);
};

let addRoleModerator = function(data) {
    let db = data.db,
        uid = data.uid,
        ms = data.meetingSeriesId;

    return new Promise((resolve, reject) => {

        let role = {};
        role['roles.' + ms] = ['01'];
        db.collection('users').updateOne(
            { '_id': uid },
            {
                $set: role
            },
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            }
        );
    });
};

let getUserId = function (data) {
    let db = data.db,
        username = data.config.username;

    return new Promise((resolve, reject) => {
        db.collection('users').findOne({username: username}, function(err, result) {
            if (err) {
                reject(err);
            } else {
                data.uid = result._id;
                resolve(data);
            }
        });
    });
};

let insertDummySeries = function (data) {
    let db = data.db,
        uid = data.uid,
        config = data.config;

    return new Promise((resolve, reject) => {
        db.collection('meetingSeries').insertOne({
            '_id': generateId(),
            'project': '4minitz - load testing',
            'name': config.meetingName,
            'createdAt': new Date(),
            'lastMinutesDate': '2016-08-02',
            'visibleFor': [uid],
            'availableLabels': [],
            'minutes': [],
            'openTopics': [],
            'topics': [],
            'additionalResponsibles': []
        }, function(err, result) {
            if (err) {
                reject(err);
            } else {
                data.meetingSeriesId = result.insertedId;
                addRoleModerator(data)
                    .then(resolve)
                    .catch(reject)
            }
        }
        );
    });
};

let linkMinuteToSeries = function(data) {
    let db = data.db,
        seriesId = data.meetingSeriesId,
        minuteIds = data.minuteIds;

    return new Promise((resolve, reject) =>  {
        db.collection('meetingSeries').updateOne(
            {_id: seriesId},
            { $pushAll: { 'minutes': minuteIds } },
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            }
        );
    });
};

let generateItems = function(minuteId, countActionItems, countInfoItems) {
    let items = [];
    let i = countActionItems + countInfoItems;
    while (i > 0) {
        let type = (i > countInfoItems) ? 'actionItem' : 'infoItem';

        let doc = {
            subject: faker.lorem.sentence(),
            createdInMinute: minuteId,
            labels: [],
            itemType: type,
            isSticky: false,
            _id: generateId()
        };

        if (type === 'actionItem') {
            doc.isOpen = false;
            doc.isNew = true;
        }

        items.push(doc);

        i--;
    }

    return items;
};

let generateTopics = function(minutesId, topicsCount, actionItemsCount, infoItemsCount) {
    let topics = [];
    let i = 0;
    while (i < topicsCount) {
        topics.push({
            _id: generateId(),
            subject: 'Topic #' + (i+1),
            responsibles: [],
            isOpen: false,
            isNew: true,
            isRecurring: false,
            labels: [],
            infoItems: generateItems(minutesId, actionItemsCount, infoItemsCount)
        });

        i++;
    }

    return topics;
};

let generateMinuteDoc = function(uid, username, seriesId, topicsCount, actionItemsCount, infoItemsCount) {
    let minId = generateId();
    return {
        '_id': minId,
        meetingSeries_id: seriesId,
        date: getNextMinutesDate(),
        topics: generateTopics(minId, topicsCount, actionItemsCount, infoItemsCount),
        visibleFor: [ uid ],
        participants: [{
            userId: uid,
            present: false,
            minuteKeeper: false
        }],
        createdAt: new Date(),
        participantsAdditional: '',
        agenda: '',
        isFinalized: true,
        isUnfinalized: false,
        finalizedAt: new Date(),
        finalizedBy: username
    };
};

let insertMinute = function(data) {
    let db = data.db,
        uid = data.uid,
        username = data.config.username,
        seriesId = data.meetingSeriesId,
        config = data.config;

    return new Promise((resolve, reject) => {
        let minutes = [],
            i = 0;

        while (i < config.minutesCount) {
            minutes.push(
                generateMinuteDoc(
                    uid, username, seriesId, config.topicsCount, config.actionItemsCount, config.infoItemsCount));
            i++;
        }

        db.collection('minutes').insert(
            minutes
            , function (err) {
            if (err) {
                reject(err);
            } else {
                data.minuteIds = minutes.map((min) => {
                    return min._id;
                });
                linkMinuteToSeries(data)
                    .then(resolve)
                    .catch(reject)
            }
        });
    });
};

let report = function(bulkResult) {
    console.log('ready');
    console.log(bulkResult);
};

readSettings(customizeFile)
    .then(config => {
        let data = {config: config};
        return connectMongo(mongoUrl, data);
    })
    .then(getUserId)
    .then(insertDummySeries)
    .then(insertMinute)
    .then(closeMongo)
    .then(report)
    .catch(error => {
        console.warn('An error occurred:');
        console.warn(error);
    });