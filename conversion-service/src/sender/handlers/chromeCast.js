const { Client: GoogleCastClient, DefaultMediaReceiver } = require('castv2-client');
const isIp = require('is-ip');

const Handler = require('./Handler');
const { chromeCastConfigSchema } = require('../schema');

// TODO: chromecast 장비 관리를 위한 manager 및 UI 구성 필요
const deviceIps = [
    '221.153.233.101', // home
];

class ChromeCastHandler extends Handler {
    async _handle({ artifactUrl, downloadUrl, config }) {
        await Promise.all(
            deviceIps.map(async ip => this._push({ ip, url: downloadUrl })),
        );
    }

    _validate({ config = {} }) {
        chromeCastConfigSchema.validate(config);
    }

    async _push({ ip, url }) {
        return new Promise(async (resolve, reject) => {
            if (!isIp(ip)) {
                throw new Error('InvalidIp');
            }

            const client = new GoogleCastClient();
            // TODO: 커스텀 타임 아웃 시간 설정 필요 (#26)
            client.connect(ip, () => {
                client.launch(DefaultMediaReceiver, (err, player) => {
                    const media = {
                        contentId: url,
                        contentType: 'audio/mp3',
                        streamType: 'BUFFERED',
                    };
                    player.load(media, { autoplay: true }, (err, status) => {
                        client.close();
                        if (err) {
                            reject(err);
                        } else {
                            resolve(status);
                        }
                    });
                });
            });

            client.on('error', (err) => {
                client.close();
                reject(err);
            });
        });
    }
}

module.exports = new ChromeCastHandler();
