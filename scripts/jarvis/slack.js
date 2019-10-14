const EventEmitter = require('events');
const { WebClient } = require('@slack/web-api');
const web = new WebClient(process.env.SLACK_TOKEN);

class SlackEmitter extends EventEmitter {
    constructor() {
        super();
        this.on('message', this.message.bind(this));

        (async () => {
            await this.getChannels();
            this.emit('ready');
        })();
    }

    async getChannels() {
        const response = await web.channels.list();
        this.channels = response.channels;
        return this.channels;
    }

    message(channel, body) {
        if (!body.fallback) { body.fallback = body.text; }

        web.chat.postMessage({
            channel: this.channels.find(c => c.name == channel).id,
            attachments: [body],
        });
    }
}

module.exports = SlackEmitter;
