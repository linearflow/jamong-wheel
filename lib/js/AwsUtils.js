const AWS = require('aws-sdk');
const { get } = require('lodash');

const logger = require('./logger');

process.env.AWS_SDK_LOAD_CONFIG = 1; // config파일의 region정보를 가져오기 위해 설정
const { AWS_REGION } = process.env;
const logSender = 'AwsUtils';

class AwsUtils {
    static get({ region }) {
        AWS.config.update({ region: region || AWS_REGION });
        const sts = new AWS.STS();
        const ssm = new AWS.SSM();
        if (!sts.config.credentials) {
            throw new Error('AWS 인증 정보를 찾을 수 없습니다.');
        }
        return new AwsUtils({ sts, ssm });
    }

    constructor({ sts, ssm }) {
        this.sts = sts;
        this.ssm = ssm;
    }

    async getParameter(name) {
        logger.info(`AWS 파라미터 스토어에서 [${name}] 파라미터를 검색합니다.`, logSender);
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

    async check({ accountId } = {}) {
        const { Account: systemAccountId } = await this.sts.getCallerIdentity().promise();
        if (accountId && accountId !== systemAccountId) {
            throw new Error(`리얼인프라 AWS 계정ID(${accountId})와 시스템 AWS 계정ID(${systemAccountId})가 일치하지 않습니다.`);
        }
    }
}

module.exports = AwsUtils;
