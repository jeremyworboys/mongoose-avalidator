var async = require('async'),
    PropValidator = require('./propvalidator');

/**
 * Run validation functions.
 * @param {Object} doc
 * @param {Object} functions
 * @param {boolean} parallel
 * @param {function} done
 */
function validate(doc, functions, parallel, done) {
    var tasks = [];
    for (var key in functions) {
        if (functions.hasOwnProperty(key)) {
            (function (key) {
                var func = functions[key];
                tasks.push(function (next) {
                    var validator = new PropValidator(doc, key, func);
                    validator.process_(next);
                });
            })(key);
        }
    }

    if (tasks.length > 0) {
        var run = (parallel ? async.parallel : async.series);
        run(tasks, function (err, results) {
            if (err)
                done(err);
            else {
                var errors = {},
                    hasError = false,
                    index = 0;
                for (var key in functions) {
                    if (functions.hasOwnProperty(key)) {
                        var result = results[index];
                        if (result.length) {
                            errors[key] = result;
                            hasError = true;
                        }
                        ++index;
                    }
                }
                done(null, hasError ? errors : null)
            }
        });
    } else {
        done();
    }
}

function avalidator(schema, options) {
    options = options || {};
    if (options.parallel === undefined)
        options.parallel = true;

    var functions = {},
        hasFunction = false;
    schema.eachPath(function (key, option) {
        if ('avalidator' in option.options) {
            hasFunction = true;
            functions[key] = option.options['avalidator'];
        }
    });
    if (hasFunction) {
        schema.pre('validate', function (next) {
            var self = this;
            validate(this, functions, options.parallel, function (err, validationErrors) {
                if (err)
                    next(err);
                else {
                    if (validationErrors) {
                        for (var key in validationErrors) {
                            if (validationErrors.hasOwnProperty(key)) {
                                self.invalidate(key, validationErrors[key]);
                            }
                        }
                    }
                    next();
                }
            });
        });
    }
}

module.exports = avalidator;