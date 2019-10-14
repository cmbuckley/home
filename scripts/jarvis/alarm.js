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
    alarm_error_unset_weekday: {
        title: 'Alarm Not Set',
        fallback: 'Alarm has not been set! Did you mean to set it?',
        text: '<!here> alarm has not been set! Did you mean to set it?',
        color: 'danger'
    }
};

slack.on('ready', function () {
    const gmail = new GmailEmitter({
        from: 'donotreply@smart-home.adt.co.uk',
        subject: 'Alarm Scenario'
    });

    gmail.on('mail', function (mail, seqno, attributes) {
        console.log('Mail received', mail);
        let code = (mail.text || mail.html).trim();
        let date = new Date(mail.headers.date);

        if (events[code]) {
            slack.emit('message', 'home-events', Object.assign({
                title: 'Alarm State Changed',
                footer: [('0' + date.getHours()).substr(-2), date.getMinutes()].join(':'),
            }, events[code]));
        } else {
            console.error('Unknown alarm code:', code);
            slack.emit('message', 'jarvis-test', {
                title: 'Unknown alarm code',
                text: code,
                color: 'warning'
            });
        }
    });
});
