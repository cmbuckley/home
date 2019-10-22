require('dotenv').config();
const Pino = require('pino');
const SlackEmitter = require('./slack');
const trainsCommand = require('./trains');
const alarmHandler = require('./alarm');

const logger = Pino({
    level: 'debug',
    redact: {
        paths: ['msg'],
        censor: function (msg) {
            if (msg.includes('LOGIN')) {
                return msg.replace(/(LOGIN "[^"]+") "[^"]+"/, '$1 "##REDACTED##"');
            }

            return msg;
        }
    }
});

const slack = new SlackEmitter({
    logger: logger,
    accessToken: process.env.SLACK_ACCESS_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    allowSlashImmediate: false,
});

slack.on('error', logger.error.bind(logger));

trainsCommand(slack, {
    defaultFrom: 'LDS',
    defaultTo: 'HFX',
    railToken: process.env.RAIL_TOKEN,
});

alarmHandler(slack, {
    logger: logger,
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
