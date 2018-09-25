const AWS = require('aws-sdk');
const moment = require('moment-timezone');
const { cloneDeep } = require('lodash');
const crypto = require('crypto');

const { eventSchema, envSchema, recipeSchema } = require('./schema');
const ConverterFactory = require('../converter/Factory');
const { AwsUtils, logger } = require('../utils');

moment.tz.setDefault('Asia/Seoul');

const logSender = 'Manager';

exports.handler = async (event, context, callback) => {
    logger.info(`람다를 실행합니다. (이벤트: ${JSON.stringify(event)})`, logSender);

    const { AWS_REGION, HISTORY_TABLE_NAME } = process.env;
    const awsUtils = AwsUtils.get({ region: AWS_REGION });
    const dynamo = new AWS.DynamoDB.DocumentClient({ region: AWS_REGION });

    try {
        logger.info('레시피를 생성합니다.', logSender);
        const recipe = buildRecipe(event, process.env);
        logger.info(`레시피정보: ${JSON.stringify(recipe)}`, logSender);

        logger.info('변환 히스토리를 DB에 저장합니다.', logSender);
        await recordHistory(recipe);

        logger.info('변환을 시작합니다.', logSender);
        const { input, conversion } = recipe;
        const converter = ConverterFactory.get({ input, conversion });
        const { extension, data } = await converter.convert();

        const { bucket, id } = conversion;
        const key = `${moment().format('YYYY/MM/DD/HH-mm-ss')}/${id}.${extension}`;
        logger.info(`변환 결과를 S3에 저장합니다. (s3://${bucket}/${key})`, logSender);
        await saveConvertedData({ bucket, key, data });

        callback(null, 'success');
    } catch (error) {
        logger.error(`실행 중에 문제가 발생하였습니다. (내용: ${error.stack})`, logSender);
        callback(error);
    }

    function buildRecipe(event, env) {
        const { CONVERSION_BUCKET } = env;
        envSchema.validate({ CONVERSION_BUCKET });
        eventSchema.validate(event);

        const recipe = cloneDeep(event);
        recipe.createdAt = moment().toISOString(true);
        recipe.conversion.id = getConversionId(recipe);
        recipe.conversion.bucket = CONVERSION_BUCKET;
        recipeSchema.validate(recipe);

        return Object.freeze(recipe);
    }

    function getConversionId(recipe) {
        return crypto.createHash('md5')
            .update(`${recipe.input.provider}-${recipe.createdAt}`).digest('hex');
    }

    async function recordHistory(recipe) {
        logger.info('컨버팅 내역을 DB에 저장합니다.', logSender);

        const { input, conversion, outputs, createdAt } = recipe;
        const params = {
            TableName: HISTORY_TABLE_NAME,
            Item: {
                id: conversion.id,
                input,
                conversion,
                outputs,
                updatedAt: createdAt,
                createdAt,
            },
        };
        await dynamo.put(params).promise();
    }

    async function saveConvertedData({ bucket, key, data }) {
        return awsUtils.putObject({ bucket, key, body: data });
    }
};
