const { get } = require('lodash');

const { handler } = require('./index.js');

describe('Reciever', () => {
    let callback = null;

    beforeEach(() => {
        callback = jest.fn();
        process.env.CONVERSION_BUCKET = 'larva.heyho.conversion-production-1';
        process.env.HISTORY_TABLE_NAME = 'HeyhoHistories';
        process.env.AWS_REGION = 'ap-northeast-2';
    });

    afterEach(() => {
        callback = null;
        delete process.env.CONVERSION_BUCKET;
        delete process.env.HISTORY_TABLE_NAME;
        delete process.env.AWS_REGION;
    });

    test('testing argument', async (done) => {
        const event = {
            input: {
                contentType: 'plain/text',
                content: '안녕하세요.',
            },
            conversion: {
                contentType: 'audio/mp3',
                provider: 'polly',
            },
            outputs: [
                { provider: 'chromecast' },
                {
                    provider: 'slack',
                    config: {
                        channel: 'test',
                    },
                },
            ],
            timeout: 10,
        };
        await handler(event, {}, callback);
        checkCallback({ callback, done });
        done();
    });
});

function checkCallback({ callback, done }) {
    const error = get(callback, 'mock.calls[0][0]');
    if (error) { done.fail(error); }
}
