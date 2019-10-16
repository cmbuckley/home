require('dotenv').config();
const SlackEmitter = require('./slack');
const trainsCommand = require('./trains');

const slack = new SlackEmitter({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    allowSlashImmediate: false,
});

slack.on('error', console.error);

trainsCommand(slack, {
    defaultFrom: 'LDS',
    defaultTo: 'HFX',
    railToken: process.env.RAIL_TOKEN
});
