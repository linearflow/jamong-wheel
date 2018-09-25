const SimpleSchema = require('simpl-schema').default;

class Handler {
    async handle({ artifactUrl, downloadUrl, config }) {
        if (!this._handle) {
            throw new Error('_handle() Not Implemented');
        }
        this.validate({ artifactUrl, downloadUrl, config });
        return this._handle({ artifactUrl, downloadUrl, config });
    }

    validate({ artifactUrl, downloadUrl, config }) {
        new SimpleSchema({
            artifactUrl: { type: String, min: 1 },
            downloadUrl: { type: String, min: 1 },
        }).validate({ artifactUrl, downloadUrl });
        if (!this._validate) {
            throw new Error('_validate() Not Implemented');
        }
        this._validate({ config });
    }
}

module.exports = Handler;
