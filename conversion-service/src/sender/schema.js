const SimpleSchema = require('simpl-schema').default;

const eventSchema = new SimpleSchema({
});

const envSchema = new SimpleSchema({
    HISTORY_TABLE_NAME: { type: String, min: 1 },
});

const slackConfigSchema = new SimpleSchema({
    responseUrl: { type: String, min: 1 },
    channelId: { type: String, min: 1 },
    userId: { type: String, min: 1 },
});

const chromeCastConfigSchema = new SimpleSchema({
});

module.exports = {
    eventSchema,
    envSchema,
    slackConfigSchema,
    chromeCastConfigSchema,
};
