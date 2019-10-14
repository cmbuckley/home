require('dotenv').config();
const GmailEmitter = require('./gmail');
const SlackEmitter = require('./slack');

const slack = new SlackEmitter();

let events = {
    alarm_state_set: {
        text: 'Alarm is fully set',
        color: 'danger'
    },
    alarm_state_partial: {
        text: 'Alarm is partially set',
        color: 'warning'
    },
    alarm_state_unset: {
        text: 'Alarm is unset',
        color: 'good'
    },
};

slack.on('ready', function () {
    const gmail = new GmailEmitter({
        from: 'donotreply@smart-home.adt.co.uk',
        subject: 'Alarm Scenario'
    });

    gmail.on('mail', function (mail, seqno, attributes) {
        console.log('Mail received', mail);
        let code = (mail.text || mail.html).trim();

        if (events[code]) {
            let body = Object.assign({}, events[code]);
            body.title = 'Alarm State Changed';
            slack.emit('message', 'home-events', body);
        } else {
            console.error('Invalid alarm code:', code);
        }
    });
});
