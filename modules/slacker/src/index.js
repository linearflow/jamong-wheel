/* eslint-disable no-console */
const SimpleSchema = require('simpl-schema').default;
const moment = require('moment-timezone');

const Slacker = require('./Slacker');

moment.tz.setDefault('Asia/Seoul');

const eventSchema = new SimpleSchema({
    method: { type: String, min: 1 },
    args: { type: Object, blackbox: true, optional: true },
});

exports.handler = async (event, context, callback) => {
    console.log(`람다를 실행합니다. (이벤트: ${JSON.stringify(event)})`);

    try {
        const { ENVIRONMENT, SLACK_TOKEN } = process.env; // eslint-disable-line no-unused-vars

        const { method, args } = event;
        eventSchema.validate({ method, args });

        const slacker = new Slacker({ token: SLACK_TOKEN });

        if (method === 'postMessage') {
            const result = await slacker.postMessage(args);
            callback(null, result);
            return;
        }

        if (method === 'postAttachment') {
            const result = await slacker.postAttachment(args);
            callback(null, result);
            return;
        }

        if (method === 'getUserRealName') {
            const result = await slacker.getUserRealName(args);
            callback(null, result);
            return;
        }

        throw new Error(`메서드(${method}) 값이 유효하지 않습니다.`);
    } catch (err) {
        callback(err);
    }
};
