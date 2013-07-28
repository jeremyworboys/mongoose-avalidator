var util = require('util'),
    nodevalidator = require('validator'),
    Validator = nodevalidator.Validator;
/**
 * Overwrite default node-validator error handling
 * @constructor
 */
function ValidatorNoThrow() {}
util.inherits(ValidatorNoThrow, Validator);

ValidatorNoThrow.prototype.error = function (msg) {
    this._errors.push(msg);
    return this;
};

ValidatorNoThrow.prototype.getErrors = function () {
    return this._errors;
};

module.exports = ValidatorNoThrow;