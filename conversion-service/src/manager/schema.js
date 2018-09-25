const SimpleSchema = require('simpl-schema').default;

const eventSchema = new SimpleSchema({
    input: { type: Object },
    'input.contentType': { type: String, min: 1, allowedValues: ['plain/text'] },
    'input.content': { type: String, min: 1 },
    conversion: { type: Object },
    'conversion.contentType': { type: String, allowedValues: ['audio/mp3'] },
    'conversion.provider': { type: String, allowedValues: ['polly'] },
    'conversion.config': { type: Object, blackbox: true, optional: true },
    outputs: { type: Object },
    'outputs.chromecast': { type: Object, blackbox: true, optional: true },
    'outputs.slack': { type: Object, blackbox: true, optional: true },
    timeout: { type: Number, min: 1 },
});

const envSchema = new SimpleSchema({
    CONVERSION_BUCKET: { type: String, min: 1 },
});

const recipeSchema = new SimpleSchema({
    conversion: eventSchema.pick('conversion'),
    'conversion.id': { type: String, regEx: /\w{32}/ },
    'conversion.bucket': { type: String, min: 1 },
    createdAt: { type: String, min: 1 },
}).extend(eventSchema);

module.exports = {
    eventSchema,
    envSchema,
    recipeSchema,
};
