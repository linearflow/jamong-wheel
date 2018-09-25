const moment = require('moment-timezone');
const querystring = require('querystring');

const { eventSchema, envSchema } = require('./schema');
const logger = require('../utils/logger');
const { AwsUtils, SlackUtils } = require('../utils');

moment.tz.setDefault('Asia/Seoul');
const logSender = 'SlackReciver';
const awsUtils = AwsUtils.get({ region: process.env.AWS_REGION });

// 슬랙 요청은 3초 안에 응답(200)을 안하면 timeout으로 간주됨.
exports.handler = async (event, context, callback) => {
    logger.info(`람다를 실행합니다. (이벤트본문: ${JSON.stringify(event.body)})`, logSender);

    const {
        MANAGER,
        SLACK_VERIFICATION_TOKEN,
        SLACK_COMMAND,
    } = process.env;
    envSchema.validate({
        MANAGER,
        SLACK_VERIFICATION_TOKEN,
        SLACK_COMMAND,
    });

    const {
        token,
        channel_id: channelId,
        user_name: userName,
        user_id: userId,
        command,
        text,
        response_url: responseUrl,
    } = querystring.parse(event.body);
    eventSchema.validate({ token, userId, userName, command, channelId, text, responseUrl });

    try {
        if (token !== SLACK_VERIFICATION_TOKEN) {
            throw new Error(`등록되어 있지 않은 슬랙 인증 토큰(\`${token}\`)입니다.`);
        }

        if (command === `${SLACK_COMMAND}`) {
            if (!text) {
                replyToSlack(responseUrl, helpText());
                sendResponse(200);
                return;
            }

            replyToSlack(responseUrl, `음성 메세지 송신을 시작합니다. :sound: \`\`\`${text}\`\`\``);

            const payload = {
                input: {
                    contentType: 'plain/text',
                    content: text,
                },
                conversion: {
                    contentType: 'audio/mp3',
                    provider: 'polly',
                },
                outputs: {
                    chromecast: {
                        // isEnabled: true,
                    },
                    slack: {
                        isEnabled: true,
                        config: {
                            responseUrl,
                            channelId,
                            userId,
                        },
                    }
                },
                timeout: 15,
            };

            awsUtils.invokeLambdaAsync({
                name: MANAGER,
                payload,
            })
                .then(result => logger.info(`Manager 람다호출정보: ${JSON.stringify(result)}`, logSender))
                .catch(error => logger.error(error));

            sendResponse(200);
            return;
        }

        throw new Error(`\`${command}\`는 지원하지 않는 슬랙 명력어입니다.`);
    } catch (error) {
        replyToSlack(responseUrl, `[문제발생] ${error.message}`);
        sendResponse(200);
    }

    function replyToSlack(responseUrl, text) { // eslint-disable-line no-shadow
        SlackUtils.responseAttachment({ responseUrl, text })
            .catch(error => logger.error(error));
    }

    function sendResponse(statusCode, message, headers = {}) {
        const response = {
            statusCode,
            headers,
            body: JSON.stringify(message),
        };
        callback(null, response);
    }

    function helpText() {
        return `\`\`\`
사용법: /echo <음성으로 보내고 싶은 메세지>
\`\`\``;
    }
};
