const { isPlainObject, isEmpty } = require('lodash');
const gulp = require('gulp');

const { AwsUtils, Shell } = require('../../lib/js');

const app = 'slacker';
const env = 'production';
const version = 1;

const region = 'ap-northeast-2';
const awsUtils = AwsUtils.get({ region });

const config = {
    stack: `${app}-${env}-${version}`,
    region,
    build: {
        outputDir: 'dist',
    },
    pack: {
        template: 'templates/deploy.yaml',
        bucket: `larva.modules.${app}.stack-${env}-${version}`,
    },
    vars: {
    },
    slack: {
        tokenName: '/slack/larva/token',
    },
};

gulp.task('check-aws', async () => {
    Shell.execute({
        command: 'aws --version',
        silent: true,
        errorMessage: 'aws 명령어가 제대로 설정되지 않았습니다.',
    });
    Shell.execute({
        command: 'sam --version',
        silent: true,
        errorMessage: 'aws 명령어가 제대로 설정되지 않았습니다.',
    });
});

gulp.task('clean', async () => {
    Shell.execute({
        command: 'yarn install && rm -rf dist && mkdir -p dist',
    });
});

gulp.task('build-prod', ['clean'], async () => {
    Shell.execute({
        command: 'rm -rf node_modules && yarn install --production',
    });
});

gulp.task('create-lambda-bucket', ['check-aws'], async () => {
    Shell.execute({
        command: `if aws s3 ls "s3://${config.pack.bucket}" 2>&1 | grep -q 'NoSuchBucket'
            then
                aws s3 --region ${config.region} mb "s3://${config.pack.bucket}"
            fi`,
    });
});

gulp.task('package', ['create-lambda-bucket', 'build-prod'], async () => {
    Shell.execute({
        command: `aws cloudformation --region ${region} package --template-file ${config.pack.template} \
            --output-template-file ${config.build.outputDir}/template-output.yaml \
            --s3-bucket ${config.pack.bucket}`,
    });
    Shell.execute({
        command: 'yarn install',
    });
});

gulp.task('deploy', ['package'], async () => {
    const slackToken = await awsUtils.getParameter(config.slack.tokenName);
    Shell.execute({
        command: `aws cloudformation --region ${region} deploy --template-file ${config.build.outputDir}/template-output.yaml \
            --stack-name ${config.stack} \
            --parameter-overrides \
                Environment=${env} \
                StackName=${config.stack} \
                SlackToken=${slackToken} \
                ${_buildTemplateParams(config.vars)} \
            --capabilities CAPABILITY_IAM`,
    });
});

gulp.task('clean-bucket', ['check-aws'], async () => {
    Shell.execute({
        command: `if ! aws s3 ls "s3://${config.pack.bucket}" 2>&1 | grep -q 'NoSuchBucket'
            then
                aws s3 rb s3://${config.pack.bucket} --force
            fi`,
    });
});

gulp.task('undeploy', ['clean', 'clean-bucket'], async () => {
    Shell.execute({
        command: `aws cloudformation --region ${region} delete-stack \
            --stack-name ${config.stack}`,
    });
    Shell.execute({
        command: 'yarn install',
    });
});

function _buildTemplateParams(params) {
    if (!isPlainObject(params) || isEmpty(params)) {
        return '';
    }
    return Object.keys(params)
        .map(key => `${key}=${JSON.stringify(params[key]).replace(/\\n/g, '')}`)
        .join(' ');
}
