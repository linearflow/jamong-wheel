const AWS = require('aws-sdk');
const { get } = require('lodash');

process.env.AWS_SDK_LOAD_CONFIG = 1; // config파일의 region정보를 가져오기 위해 설정
const { AWS_REGION } = process.env;

class AwsUtils {
    static get({ region }) {
        AWS.config.update({ region: region || AWS_REGION });
        const sts = new AWS.STS();
        const ssm = new AWS.SSM();
        const lambda = new AWS.Lambda();
        const s3 = new AWS.S3();
        if (!sts.config.credentials) {
            throw new Error('AWS 인증 정보를 찾을 수 없습니다.');
        }
        return new AwsUtils({ sts, ssm, lambda, s3 });
    }

    constructor({ sts, ssm, lambda, s3 }) {
        this.sts = sts;
        this.ssm = ssm;
        this.lambda = lambda;
        this.s3 = s3;
    }

    // ===== System Mnager API ======

    async getParameter(name) {
        const params = { Name: name };
        const result = await this.ssm.getParameter(params).promise();
        return get(result, 'Parameter.Value');
    }

    async putParameter(name, value) {
        const params = {
            Name: name,
            Type: 'String',
            Value: value,
            Overwrite: true,
        };
        await this.ssm.putParameter(params).promise();
    }

    // ===== Lambda API ======

    /**
     * 람다 호출 (동기적)
     * @param {string} name - 호출할 람다명 또는 ARN
     * @param {Object} payload - 람다의 인자로 사용할 이벤트
     * @returns {Promise} 람다의 응답을 반환하는 프라미스
     */
    async invokeLambda({ name, payload }) {
        const params = {
            FunctionName: name,
            LogType: 'Tail',
            Payload: JSON.stringify(payload),
        };
        return this.lambda.invoke(params).promise();
    }

    /**
     * 람다 호출 (비동기적)
     * @param {string} name - 호출할 람다명 또느 ARN
     * @param {Object} payload - 람다의 인자로 사용할 이벤트
     * @returns {Promise} 람다의 응답을 반환하는 프라미스
     */
    async invokeLambdaAsync({ name, payload }) {
        const params = {
            FunctionName: name,
            InvocationType: 'Event', // [Event, RequestResponse(default), DryRun]
            LogType: 'Tail',
            Payload: JSON.stringify(payload),
        };
        return this.lambda.invoke(params).promise();
    }

    // ===== S3 API ======

    async putObject({ bucket, key, body }) {
        const params = {
            Bucket: bucket,
            Key: key,
            Body: body,
        };
        return this.s3.putObject(params).promise();
    }

    getSignedUrl({ method, bucket, key, timeout }) {
        if (!['getObject'].includes(method)) {
            throw new Error('UnsupportedS3SignedMethod');
        }
        const params = {
            Bucket: bucket,
            Key: key,
            Expires: timeout,
        };
        return this.s3.getSignedUrl(method, params);
    }

    async check({ accountId } = {}) {
        const { Account: systemAccountId } = await this.sts.getCallerIdentity().promise();
        if (accountId && accountId !== systemAccountId) {
            throw new Error(`리얼인프라 AWS 계정ID(${accountId})와 시스템 AWS 계정ID(${systemAccountId})가 일치하지 않습니다.`);
        }
    }
}

module.exports = AwsUtils;
