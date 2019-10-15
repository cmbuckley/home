const EventEmitter = require('events');
const { WebClient } = require('@slack/web-api');
const web = new WebClient(process.env.SLACK_TOKEN);

class SlackEmitter extends EventEmitter {
    constructor() {
        super();

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

    postMessage(channel, options) {
        options.channel = this.channels.find(c => c.name == channel).id;
        web.chat.postMessage(options);
    }
}

module.exports = SlackEmitter;
