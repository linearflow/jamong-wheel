/* eslint-disable object-property-newline */
const { WebClient } = require('@slack/client');
const SimpleSchema = require('simpl-schema').default;
const { get } = require('lodash');

/**
 * @class Slacker
 *  - https://slackapi.github.io/node-slack-sdk/
 */
module.exports = class Slacker {
    /**
     * 생성자
     * @param {String} token - 슬랙 토큰 (https://api.slack.com/docs/token-types)
     */
    constructor({ token }) {
        if (!token) {
            throw new Error('TokenRequired', '슬랙 토큰값이 제공되어야합니다.');
        }
        this.webApi = new WebClient(token);
    }

    /**
     * 슬랙 WebApi 모듈을 외부에서도 직접 사용할 수 있도록 제공
     */
    getWebApi() {
        return this.webApi;
    }

    /**
     * 메세지 보내기
     *  - https://api.slack.com/methods/chat.postMessage
     * @return {Promise} 전송 결과를 반환하는 프라미스
     */
    postMessage({ channel, text, attachments }) {
        new SimpleSchema({
            channel: { type: String, min: 1 },
            text: { type: String, min: 1 },
            attachments: { type: Array, optional: true },
            'attachments.$': { type: Object, blackbox: true },
        }).validate({ channel, text, attachments });

        return this.webApi.chat.postMessage({
            channel: channel || this.channel,
            text,
            attachments,
        });
    }

    /**
     * 첨부 형식으로 메세지 보내기
     *  - https://slackapi.github.io/node-slack-sdk/web_api#adding-attachments-to-a-message
     * @return {Promise} 전송 결과를 반환하는 프라미스
     */
    postAttachment({
        channel, color, pretext, authorName, authorLink,
        title, titleLink, text, fields, footer, footerIcon, ts,
    }) {
        new SimpleSchema({
            channel: { type: String, min: 1 },
            color: { type: String, min: 1, optional: true }, // [good|warning|danger|#RRGGBB]
            pretext: { type: String, min: 1, optional: true },
            authorName: { type: String, min: 1, optional: true },
            authorLink: { type: String, min: 1, optional: true },
            title: { type: String, min: 1, optional: true },
            titleLink: { type: String, min: 1, optional: true },
            text: { type: String, min: 1, optional: true },
            fields: { type: Array, optional: true },
            'fields.$': { type: Object },
            'fields.$.title': { type: String, min: 1 },
            'fields.$.value': { type: String, min: 1 },
            'fields.$.short': { type: Boolean },
            footer: { type: String, min: 1, optional: true },
            footerIcon: { type: String, min: 1, optional: true },
            ts: { type: Number, optional: true },
        }).validate({
            channel, color, pretext, authorName, authorLink,
            title, titleLink, text, fields, footer, footerIcon, ts,
        });

        return this.webApi.chat.postMessage({
            channel: channel || this.channel,
            attachments: [{
                pretext,
                author_name: authorName,
                author_link: authorLink,
                title,
                title_link: titleLink,
                text,
                fields,
                color,
                mrkdwn_in: ['title', 'text', 'pretext'],
                footer,
                footer_icon: footerIcon,
                ts,
            }],
        });
    }

    /**
     * 사용자 리얼 이름 가져오기
     *  - https://api.slack.com/methods/users.profile.get
     * @return {Promise} 전송 결과를 반환하는 프라미스
     */
    async getUserRealName({ userId }) {
        new SimpleSchema({
            userId: { type: String, min: 1 },
        }).validate({ userId });

        const userInfo = await this.webApi.users.info({
            user: userId,
        });
        return get(userInfo, 'user.real_name');
    }
};
