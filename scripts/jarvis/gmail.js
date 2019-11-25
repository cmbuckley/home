const EventEmitter = require('events');
const MailListener = require('@digitalgarage/mail-listener');

let listenerConfig = {
    imapOptions: {
        host: 'imap.gmail.com',
        port: 993, // imap port
        tls: true,
        connTimeout: 10000, // Default by node-imap
        authTimeout: 5000, // Default by node-imap,
        debug: console.log,
        tlsOptions: { rejectUnauthorized: true },
        //keepalive: { forceNoop: true },
    },
    mailbox: 'INBOX', // mailbox to monitor
    searchFilter: ['UNSEEN'], // the search filter being used after an IDLE notification has been retrieved
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time
    fetchOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
};

class GmailEmitter extends EventEmitter {
    constructor(options) {
        super();

        if (options.logger) { listenerConfig.imapOptions.debug = options.logger.debug.bind(options.logger); }
        listenerConfig.imapOptions.username = options.username;
        listenerConfig.imapOptions.password = options.password;

        const listener = new MailListener(listenerConfig);
        listener.start();

        listener.on('server:disconnected', function () {
            options.logger.warn('IMAP server disconnected - attempting reconnect');
            listener.start();
        });

        listener.on('error', function (err) {
            this.emit('error', err);
        });

        listener.on('mail', function (mail, seqno, attributes) {
            if (mail.headers.get('from').value[0].address == options.from && (!options.subject || mail.headers.get('subject') == options.subject)) {
                this.emit('mail', mail, seqno, attributes);
            }
        }.bind(this));
    }
}

module.exports = GmailEmitter;
