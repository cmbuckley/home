require('dotenv').config();
const SlackEmitter = require('./slack');
const trainsCommand = require('./trains');
const alarmHandler = require('./alarm');

const slack = new SlackEmitter({
    accessToken: process.env.SLACK_ACCESS_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    allowSlashImmediate: false,
});

slack.on('error', console.error);

trainsCommand(slack, {
    defaultFrom: 'LDS',
    defaultTo: 'HFX',
    railToken: process.env.RAIL_TOKEN,
});

alarmHandler(slack, {
    email: {
        username: process.env.GMAIL_USERNAME,
        password: process.env.GMAIL_PASSWORD,
        from: 'donotreply@smart-home.adt.co.uk',
        subject: 'Alarm Scenario',
    },
    channel: {
        default: 'home-events',
        error: 'jarvis-test',
    },
});
