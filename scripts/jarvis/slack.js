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

    message(channel, options) {
        options.channel = this.channels.find(c => c.name == channel).id;
        web.chat.postMessage(options);
    }
}

module.exports = SlackEmitter;
