const SimpleSchema = require('simpl-schema').default;

const eventSchema = new SimpleSchema({
    token: { type: String, min: 1 },
    channelId: { type: String, min: 1 },
    userId: { type: String, min: 1 },
    userName: { type: String, min: 1 },
    command: { type: String, min: 1 },
    text: { type: String },
    responseUrl: { type: String, min: 1 },
});

const envSchema = new SimpleSchema({
    MANAGER: { type: String, min: 1 },
    SLACK_VERIFICATION_TOKEN: { type: String, min: 1 },
    SLACK_COMMAND: { type: String, regEx: /^\/[a-zA-Z0-9가-힣]+$/ },
});

module.exports = {
    eventSchema,
    envSchema,
};
