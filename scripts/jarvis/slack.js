const crypto = require('crypto');
const EventEmitter = require('events');
const qs = require('qs');
const Fastify = require('fastify');
const { WebClient } = require('@slack/web-api');
const { IncomingWebhook } = require('@slack/webhook');

const fastify = Fastify({logger: true});

// we need the raw body for the signature verification, so parse as plain text (but parse before the handler)
fastify.addContentTypeParser('application/x-www-form-urlencoded', {parseAs: 'string'}, (req, body, done) => done(null, body));
fastify.addHook('preHandler', (req, res, done) => { req.data = qs.parse(req.body); done(); });

// server to listen for /slash commands
function createServer(slack) {
    let immediate = slack.options.allowSlashImmediate,
        timeout;

    // either respond immediately or post reply via webhook
    function respond(req, res) {
        return function (message) {
            if (immediate) {
                clearTimeout(timeout);
                return res.send(message);
            }

            const webhook = new IncomingWebhook(req.data.response_url);
            webhook.send(message);
        };
    }

    // verify the request signature
    function verify(req) {
        // recreate each time
        const hmac = crypto.createHmac('sha256', slack.options.signingSecret);

        let signature = req.headers['x-slack-signature'].split('='),
            timestamp = req.headers['x-slack-request-timestamp'],
            basestring = [signature[0], timestamp, req.body].join(':');

        try {
            return (signature[1] == hmac.update(basestring).digest('hex'));
        } catch (err) {
            fastify.log.warn(err);
            console.log(basestring);
        }
    }

    fastify.post('/', function (req, res) {
        // parse command arguments
        let command = req.data.command.replace(/^\//, ''),
            args = req.data.text.match(/(?<=“|")[^"“”]+?(?=”|")|[^\s"“”]+/g) || [];

        // exit cleanly for non-verified requests
        if (!verify(req)) {
            fastify.log.warn('Could not verify request');
            return res.send();
        }

        if (immediate) {
            // force a response if handler is slow
            timeout = setTimeout(function () {
                immediate = false;
                res.send();
            }, 2000);
        } else {
            res.send();
        }

        // targeted slash:command event, plus generic slash event
        slack.emit('slash:' + command, args, respond(req, res));
        slack.emit('slash', command, args, respond(req, res));
    });
}

class SlackEmitter extends EventEmitter {
    constructor(options) {
        super();

        this.options = options || {};
        this.webClient = new WebClient(this.options.accessToken);
        createServer(this);

        (async () => {
            try {
                await this.getChannels();
            } catch (err) {
                return this.emit('error', err);
            }

            try {
                await fastify.listen(3000);
                this.emit('ready');
            } catch (err) {
                fastify.log.error(err);
                this.emit('error', err);
            }
        })();
    }

    async getChannels() {
        const response = await this.webClient.channels.list();
        this.channels = response.channels;
        return this.channels;
    }

    postMessage(channel, options) {
        options.channel = this.channels.find(c => c.name == channel).id;
        this.webClient.chat.postMessage(options);
    }
}

module.exports = SlackEmitter;
