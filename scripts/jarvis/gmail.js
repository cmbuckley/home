const EventEmitter = require('events');
const MailListener = require('mail-listener2');

const listener = new MailListener({
    username: process.env.GMAIL_USERNAME,
    password: process.env.GMAIL_PASSWORD,
    host: 'imap.gmail.com',
    port: 993, // imap port
    tls: true,
    connTimeout: 10000, // Default by node-imap
    authTimeout: 5000, // Default by node-imap,
    debug: console.log, // Or your custom function with only one incoming argument. Default: null
    tlsOptions: { rejectUnauthorized: true },
    mailbox: 'INBOX', // mailbox to monitor
    searchFilter: ['UNSEEN'], // the search filter being used after an IDLE notification has been retrieved
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time
    fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
    //mailParserOptions: {streamAttachments: true}, // options to be passed to mailParser lib.
    //attachments: true, // download attachments as they are encountered to the project directory
    //attachmentOptions: { directory: 'attachments/' } // specify a download directory for attachments
});

class GmailEmitter extends EventEmitter {
    constructor(options) {
        super();
        listener.start();

        listener.on('error', function (err) {
            this.emit('error', err);
        });

        listener.on('mail', function (mail, seqno, attributes) {
            if (mail.from[0].address == options.from && (!options.subject || mail.subject == options.subject)) {
                this.emit('mail', mail, seqno, attributes);
            }
        }.bind(this));
    }
}

module.exports = GmailEmitter;