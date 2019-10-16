const moment = require('moment-timezone');
const GmailEmitter = require('./gmail');

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

module.exports = function (slack, options) {
    slack.on('ready', function () {
        const gmail = new GmailEmitter(options.email);

        gmail.on('mail', function (mail, seqno, attributes) {
            console.log('Mail received', mail);
            let code = (mail.text || mail.html).trim();

            if (events[code]) {
                slack.postMessage(options.channel.default, {
                    attachments: [Object.assign({
                        title: 'Alarm State Changed',
                        footer: moment(mail.headers.date).format('LT'),
                    }, events[code])]
                });
            } else {
                console.error('Unknown alarm code:', code);
                slack.postMessage(options.channel.error, {
                    attachments: [{
                        title: 'Unknown alarm code',
                        text: code,
                        color: 'warning',
                        footer: moment(mail.headers.date).format('LT'),
                    }]
                });
            }
        });
    });
};
