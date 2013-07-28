"use strict";

var assert = require('assert'),
    async = require('async'),
    mongoose = require('mongoose'),
    avalidator = require('../');

describe('schema-validator', function () {
    before(function (done) {
        done();
    });

    after(function (done) {
        done();
    });

    it('should skip if no function defined', function (done) {
        var schema = mongoose.Schema({
            email: {type: String}
        }).
            plugin(avalidator);

        var User = mongoose.model('TestSkip', schema),
            model = new User();

        model.save(function (err) {
            assert.ifError(err);
            done();
        });
    });

    it('test sync validation', function (done) {
        var schema = mongoose.Schema({
            _id: { type: String, avalidator: function () {
                this.check({
                    notNull: 'name is null',
                    regex: 'name is invalid'
                }).
                    notNull().
                    regex('^[a-zA-Z0-9_]+$');
            }
            }, //username
            email: {
                type: String,
                avalidator: function () {
                    this.str = this.sanitize.chain().
                        ltrim('a').rtrim('z').str;

                    this.check({
                        notNull: 'email is null',
                        isEmail: 'email is invalid'
                    }).
                        notNull().
                        isEmail();
                }
            }
        }).
            plugin(avalidator);

        var User = mongoose.model('TestSync', schema),
            model = new User();

        model.save(function (err) {
            assert.ok(err, 'Should fail.');
            assert.deepEqual(err.errors._id, ['name is null', 'name is invalid']);
            assert.deepEqual(err.errors.email, ['email is null', 'email is invalid']);

            model._id = 'valid';
            model.email = 'xxxxxinvalid';

            model.save(function (err) {
                assert.ok(err, 'Should fail.');
                assert.deepEqual(err.errors._id, undefined);
                assert.deepEqual(err.errors.email, ['email is invalid']);

                model.email = 'aaaaaaaaaaaaaavalid@gmail.comzzzzzzzzzzzzzzzzzzzzzzzz';

                User.remove({_id: 'valid'}, function (err) {
                    if (err) throw err;
                    model.save(function (err, obj) {
                        assert.ifError(err);
                        assert.equal(obj._id, model._id);
                        assert.equal(model.email, 'valid@gmail.com');
                        assert.equal(obj.email, model.email);
                        mongoose.connection.db.dropCollection('testsyncs');
                        done();
                    });
                });
            });
        });
    });

    it('test async validation', function (done) {
        var schema = mongoose.Schema({
            _id: { type: String, avalidator: function (done) {
                this.check({
                    notNull: 'name is null',
                    regex: 'name is invalid'
                }).
                    notNull().
                    regex('^[a-zA-Z0-9_]+$');

                setTimeout(function () {
                    done(null);
                }, 1);
            }
            }, //username
            email: {
                type: String,
                avalidator: function (done) {
                    this.str = this.sanitize.chain().
                        ltrim('a').rtrim('z').str;

                    this.check({
                        notNull: 'email is null',
                        isEmail: 'email is invalid'
                    }).
                        notNull().
                        isEmail();

                    setTimeout(function () {
                        done(null);
                    }, 1);
                }
            }
        }).
            plugin(avalidator);

        var User = mongoose.model('TestAsync', schema),
            model = new User();

        model.save(function (err) {
            assert.ok(err, 'Should fail.');
            assert.deepEqual(err.errors._id, ['name is null', 'name is invalid']);
            assert.deepEqual(err.errors.email, ['email is null', 'email is invalid']);

            model._id = 'valid';
            model.email = 'xxxxxinvalid';

            model.save(function (err) {
                assert.ok(err, 'Should fail.');
                assert.deepEqual(err.errors._id, undefined);
                assert.deepEqual(err.errors.email, ['email is invalid']);

                model.email = 'aaaaaaaaaaaaaavalid@gmail.comzzzzzzzzzzzzzzzzzzzzzzzz';

                User.remove({_id: 'valid'}, function (err) {
                    if (err) throw err;
                    model.save(function (err, obj) {
                        assert.ifError(err);
                        assert.equal(obj._id, model._id);
                        assert.equal(model.email, 'valid@gmail.com');
                        assert.equal(obj.email, model.email);
                        mongoose.connection.db.dropCollection('testasyncs');
                        done();
                    });
                });
            });
        });
    });

    it('test running validation function in series', function (done) {
        var schema = mongoose.Schema({
            email: {
                type: String,
                avalidator: function (done) {
                    var self = this;
                    setTimeout(function () {
                        self.str = self.sanitize.chain().
                            ltrim('a').rtrim('z').str;

                        self.check({
                            notNull: 'email is null',
                            isEmail: 'email is invalid'
                        }).
                            notNull().
                            isEmail();
                        done(null);
                    }, 10);
                }
            },
            emailprovider: {
                type: String,
                avalidator: function () {
                    var matches = this.model.email.match(/^[^@]+@([^\.]+)\.([^\.]{3}$)/),
                        provider = Array.isArray(matches) ? matches[1] : '';
                    this.check({
                        equals: 'provider not match: %1'
                    }).
                        equals(provider);
                }
            }
        }).
            plugin(avalidator, {parallel: false});

        var User = mongoose.model('TestSeries', schema),
            model = new User();

        model.email = 'email@hotmail.com';
        model.emailprovider = 'gmail';
        model.save(function (err) {
            assert.ok(err, 'Should fail.');
            assert.deepEqual(err.errors.email, undefined);
            assert.deepEqual(err.errors.emailprovider, ['provider not match: hotmail']);

            model.email = 'aaaaaaaaaaaaaavalid@gmail.comzzzzzzzzzzzzzzzzzzzzzzzz';
            model.emailprovider = 'gmail';
            model.save(function (err, obj) {
                assert.ifError(err);
                assert.equal(obj.emailprovider, 'gmail');
                assert.equal(obj.email, model.email);
                assert.equal(model.email, 'valid@gmail.com');
                mongoose.connection.db.dropCollection('testseries');
                done();
            });
        });
    });
});
