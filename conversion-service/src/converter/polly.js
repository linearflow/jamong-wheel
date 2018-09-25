const AWS = require('aws-sdk');
const moment = require('moment-timezone');
const SimpleSchema = require('simpl-schema').default;

const logger = require('../utils/logger');
const Converter = require('./Converter');

const { AWS_REGION } = process.env;
const logSender = 'Polly';

module.exports = class Polly extends Converter {
    constructor({ input, conversion }) {
        super({ input, conversion });
        const polly = new AWS.Polly({
            apiVersion: '2016-06-10',
            signatureVersion: 'v4',
            region: AWS_REGION,
        });
        this.sdk = polly;
    }

    async convert() {
        logger.info('Text To Speach 변환을 시작합니다.', logSender);
        const { content } = this.input;

        const params = {
            OutputFormat: 'mp3',
            Text: content,
            VoiceId: 'Seoyeon',
        };
        const result = await this.sdk.synthesizeSpeech(params).promise();

        return {
            extension: 'mp3',
            data: result.AudioStream,
        };
    }

    get configSchema() {
        return new SimpleSchema({
        });
    }

    _validate() {
        const { contentType: inputContentType } = this.input;
        const { contentType: outputContentType, provider, config } = this.conversion;

        if (provider !== 'polly') {
            throw new Error('ConvesionProviderNotPolly');
        }
        this.configSchema.validate(config || {});

        if (!['plain/text'].includes(inputContentType)) {
            throw new Error('UnsupportedInputContentType');
        }
        if (!['audio/mp3'].includes(outputContentType)) {
            throw new Error('UnsupportedInputContentType');
        }
    }
};
