const fetch = require('node-fetch');
const SimpleSchema = require('simpl-schema').default;

class SlackUtils {
    static async responseAttachment({ responseUrl, responseType, title, text, color }) {
        new SimpleSchema({
            responseUrl: { type: String, min: 1 },
            title: { type: String, min: 1, optional: true },
            text: { type: String, min: 1, optional: true },
            color: { type: String, min: 1, optional: true },
        }).validate({ responseUrl, text, color });

        return fetch(responseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                response_type: responseType || 'ephemeral',
                replace_original: false,
                attachments: [{
                    title,
                    text,
                    color,
                    mrkdwn_in: ['title', 'text', 'pretext'],
                }],
                mrkdwn: true,
            }),
        });
    }

    static async response({ responseUrl, text, attachments }) {
        new SimpleSchema({
            responseUrl: { type: String, min: 1 },
            text: { type: String, min: 1 },
        }).validate({ responseUrl, text });

        return fetch(responseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                response_type: 'ephemeral',
                replace_original: false,
                text,
                attachments,
                mrkdwn: true,
            }),
        });
    }
}

module.exports = SlackUtils;
