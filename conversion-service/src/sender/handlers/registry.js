const { isPlainObject, isEmpty } = require('lodash');

const Handler = require('./Handler');
const slackHandler = require('./slack');
const chromeCastHandler = require('./chromeCast');

class HandlerRegistry {
    constructor(handlers) {
        this.handlers = handlers;
        this._validate({ handlers });
    }

    find(provider) {
        return this.handlers[provider];
    }

    _validate({ handlers } = {}) {
        if (!isPlainObject(handlers) || isEmpty(handlers)) {
            throw new Error('InvalidHandlers');
        }
        const invalid = Object.values(handlers).find(handler => !(handler instanceof Handler));
        if (invalid) {
            throw new Error('InvalidHandlerFound');
        }
    }
}

module.exports = new HandlerRegistry({
    slack: slackHandler,
    chromecast: chromeCastHandler,
});
