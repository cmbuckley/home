require('dotenv').config();
const Pino = require('pino');
const SlackEmitter = require('./slack');
const trainsCommand = require('./trains');

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
