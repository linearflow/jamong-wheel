const { isPlainObject, isEmpty } = require('lodash');
const gulp = require('gulp');

const { Shell, AwsUtils } = require('../lib/js');

const app = 'heyho';
const env = 'second';
const version = 1;
const region = 'ap-northeast-1';

const awsUtils = AwsUtils.get({ region });

const config = {
    stack: `${env}-${app}-${version}`,
    region,
    build: {
        outputDir: 'dist',
    },
    pack: {
        template: 'templates/deploy.yaml',
        bucket: `${env}.${app}.stack-${version}`,
    },
    vars: {
        SlackerStack: `slacker-${env}-1`,
        SlackCommand: '/에코',
        ConversionBucketName: `${env}.${app}.conversion-${version}`,
        HistoryTableName: `HeyhoHistories-${env}-${version}`,
    },
    slack: {
        verficationTokenName: `/${env}/${app}/slack/verification-token`,
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
        command: 'rm -rf dist && mkdir -p dist',
    });
});

gulp.task('build-prod', ['clean'], async () => {
    Shell.execute({
        command: 'yarn install --production',
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
    const slackVerificationToken = await awsUtils.getParameter(config.slack.verficationTokenName);
    Shell.execute({
        command: `aws cloudformation --region ${region} deploy --template-file ${config.build.outputDir}/template-output.yaml \
            --stack-name ${config.stack} \
            --parameter-overrides \
                Environment=${env} \
                StackName=${config.stack} \
                SlackVerificationToken=${slackVerificationToken} \
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
    Shell.execute({
        command: `if ! aws s3 ls "s3://${config.vars.ConversionBucketName}" 2>&1 | grep -q 'NoSuchBucket'
            then
                aws s3 rb s3://${config.vars.ConversionBucketName} --force
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

gulp.task('list-outputs', ['check-aws'], async () => {
    Shell.execute({
        command: `aws cloudformation --region ${region} describe-stacks \
            --stack-name ${config.stack} \
            --query 'Stacks[0].Outputs'`,
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
