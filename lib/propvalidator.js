var nodevalidator = require('validator'),
    ValidatorNoThrow = require('./validator-nothrow'),
    Filter = nodevalidator.Filter;

function PropValidator(model, prop, func) {
    var self = this;

    this.str = model[prop];

    var validator_ = new ValidatorNoThrow(),
        filter_ = null;


    Object.defineProperties(this, {
        /**
         * returns currently validating model
         */
        'model': {
            get: function () {
                return model;
            }
        },

        /**
         * returns node-validator.Filter
         */
        'sanitize': {
            get: function () {
                if (!filter_)
                    filter_ = new Filter();
                return filter_.sanitize(self.str);
            }
        }
    });

    /**
     * Simply returns node-validator.Validator filled with current property value
     * @param messages
     * @returns {*}
     */
    this.check = function (messages) {
        return validator_.check(this.str, messages);
    };

    this.process_ = function (done) {
        var self = this;
        if (func.length === 0) {
            //sync
            func.call(this);
            model[prop] = this.str;
            done(null, validator_.getErrors());
        } else {
            //async
            func.call(this, function (err) {
                if (err)
                    done(err);
                else {
                    model[prop] = self.str;
                    done(null, validator_.getErrors());
                }
            });
        }
    };
}

module.exports = PropValidator;