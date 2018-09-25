const Converter = require('./Converter');
const Polly = require('./polly');

const CONVERTERS = {
    polly: Polly,
};

module.exports = class ConverterFactory {
    static get({ input, conversion }) {
        this._validate({ converters: CONVERTERS });
        const ConverterClass = CONVERTERS[conversion.provider];
        if (!ConverterClass) {
            throw new Error('ConverterClassNotFound');
        }
        return new ConverterClass({ input, conversion });
    }

    static _validate({ converters = {} }) {
        const isValid = Object.values(converters)
            .find(converterClass => !(converterClass.prototype instanceof Converter));
        if (isValid) {
            throw new Error('InvalidConverterClasses');
        }
    }
};
