const moment = require('moment-timezone');
const AWS = require('aws-sdk');
const { get } = require('lodash');

const handlerRegistry = require('./handlers/registry');
const { AwsUtils } = require('../utils');
const { envSchema } = require('./schema');
const logger = require('../utils/logger');

moment.tz.setDefault('Asia/Seoul');
const logSender = 'Sender';

exports.handler = async (event, context, callback) => {
    logger.info(`람다를 실행합니다. (이벤트: ${JSON.stringify(event, null, 2)})`, logSender);

    const {
        AWS_REGION,
        HISTORY_TABLE_NAME,
    } = process.env;
    envSchema.validate({ HISTORY_TABLE_NAME });

    const dynamo = new AWS.DynamoDB.DocumentClient({ region: AWS_REGION });
    const awsUtils = AwsUtils.get({ region: AWS_REGION });

    try {
        const bucket = get(event, 'Records[0].s3.bucket.name');
        const objKey = get(event, 'Records[0].s3.object.key');
        if (!bucket || !objKey) {
            throw new Error('S3DataNotFound');
        }
        const artifactUrl = `https://s3.console.aws.amazon.com/s3/object/${bucket}/${objKey}?region=${AWS_REGION}&tab=overview`;
        const downloadUrl = awsUtils.getSignedUrl({
            method: 'getObject',
            bucket,
            key: objKey,
            timeout: 21600,
        });

        const historyId = getHistoryId(objKey);
        if (!historyId) {
            throw new Error('HistoryIdNotFound');
        }
        console.log('historyId:', historyId);

        const { outputs } = await getHistory(historyId);

        await Promise.all(Object.keys(outputs).map(async (provider) => {
            const { isEnabled, config, isSent } = get(outputs, provider);

            if (!isEnabled) { return; }
            console.log(`${provider} 보내기 작업을 시작합니다.`);

            // 람다가 반복 호출될 경우 대응 (타임아웃 에러등)
            if (isSent) {
                logger.info(`[${provider}] 보내기 작업은 이미 완료되었으므로 무시됩니다.`, logSender);
                return;
            }

            const handler = handlerRegistry.find(provider);
            if (handler) {
                // 핸들러의 예외는 각 핸들러에서 직접 처리하고 핸들러끼리는 서로 영향을 주지 않는다.
                try {
                    await handler.handle({ artifactUrl, downloadUrl, config });
                    await recordResultInHistory({ id: historyId, provider });
                } catch (error) {
                    logger.error(`[문제발생] ${error.stack}`, logSender);
                    await recordResultInHistory({ id: historyId, provider, error });
                }
            } else {
                logger.error(`[${provider}] 핸들러를 찾을 수 없습니다.`);
            }
        }));

        callback(null, 'lamba closed');
    } catch (error) {
        logger.error(`실행 중에 문제가 발생하였습니다. (내용: ${error.stack})`, logSender);
        callback(error);
    }

    function getHistoryId(objKey) {
        const [_, id] = objKey.match(/^\d{4}\/\d\d\/\d\d\/\d\d-\d\d-\d\d\/(\w{32})\..*$/) || []; // eslint-disable-line no-unused-vars
        return id;
    }

    async function getHistory(id) {
        const params = {
            TableName: HISTORY_TABLE_NAME,
            Key: { id },
        };
        const result = await dynamo.get(params).promise();
        return result.Item;
    }

    async function recordResultInHistory({ id, provider, error }) {
        logger.info('DB에 작업 결과를 저장합니다.');
        const params = {
            TableName: HISTORY_TABLE_NAME,
            Key: { id },
            UpdateExpression: 'set outputs.#provider.isSent = :isSent, outputs.#provider.errorReason = :errorReason, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#provider': provider,
            },
            ExpressionAttributeValues: {
                ':isSent': error ? false : true,
                // Dynamodb는  (undefined, '')를 지원하지 않는다. (https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html)
                ':errorReason': get(error, 'message', null),
                ':updatedAt': moment().toISOString(true),
            },
        };
        await dynamo.update(params).promise();
    }
};
