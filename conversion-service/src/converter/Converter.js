const { recipeSchema } = require('../manager/schema');

module.exports = class Converter {
    constructor({ input, conversion }) {
        this.input = input;
        this.conversion = conversion;
        this.validate();
    }

    async convert() {
        throw new Error('convert() was not overrided');
    }

    validate() {
        recipeSchema.getObjectSchema('input').validate(this.input);
        recipeSchema.getObjectSchema('conversion').validate(this.conversion);
        this._validate();
    }
};
