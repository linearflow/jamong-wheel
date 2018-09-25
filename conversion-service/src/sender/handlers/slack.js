const Handler = require('./Handler');
const { slackConfigSchema } = require('../schema');
const { SlackUtils } = require('../../utils');

class SlackHandler extends Handler {
    async _handle({ artifactUrl, downloadUrl, config }) {
        const { responseUrl, userId } = config;
        const message = `<@${userId}>님이 <${downloadUrl}|에코>하셨어요. :kissing_heart:`;
        await SlackUtils.responseAttachment({
            responseUrl,
            responseType: 'in_channel',
            title: message,
            color: this._getRandomColor(),
        });
    }

    _validate({ config = {} }) {
        slackConfigSchema.validate(config);
    }

    _getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i += 1) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color; 
    }
}

module.exports = new SlackHandler();
