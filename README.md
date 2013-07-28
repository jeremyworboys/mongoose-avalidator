mongoose-avalidator
==================

A mongoose plugin utilizing [node-validator](https://github.com/chriso/node-validator).
Unlike some similar packages, it:
* is a **plugin** for mongoose.Schema
* inherits node-validator's API convention
* supports asynchronous validation
* supports sanitize (Filter)
* can run validations in parallel or in series

## Quick Examples

### Config schema to use mongoose-avalidator
```javascript
var avalidator = require('mongoose-avalidator');
var props = {
  foo: { type: String, avalidator: function(...) {...}}  
};

var schema = mongoose.Schema(props).plugin(avalidator, options);
```
or
```javascript
var avalidator = require('mongoose-avalidator');
var schema = mongoose.Schema({
  foo: { type: String}
}).plugin(avalidator, {
    validate: {
        foo: function(...) {...}
    }
});
```
#### Avaliable Options
Option|Description|Default
--- | --- | ---
validate|Define validation functions|undefined
parallel|Whether run validation functions in parallel|true

### Use [node-validator](https://github.com/chriso/node-validator).
Basiclly because every validation function is mapped to a document property, the first argument to 'check' and 'sanitize' is omitted.

node-validator|mongoose-avalidator
--- | --- | ---
check('string', 'Required!').notNull()|this.check('Required!').notNull()
var result = sanitize('string').trim()|this.str = this.sanitize.trim()

You can get/set current mapped property's value by using **this.str**.
Current model can be accessed by using **this.model**.

### Synchronous validation function example
Function has no argument.
```javascript
function () {
  //sanitize
  this.str = this.sanitize.trim();

  //validate
  this.check({
    notNull: 'Username is required.',
    regex: 'Username is invalid'
  }).
    notNull().
    regex('^[a-zA-Z0-9_]+$');
}
```

### Asynchronous validation function example
Function has one argument as callback.
```javascript
function (done) {
  //sanitize
  this.str = this.sanitize.trim();

  //validate
  this.check({
    notNull: 'Username is required.',
    regex: 'Username is invalid'
  }).
    notNull().
    regex('^[a-zA-Z0-9_]+$');

  //asynchronous validation logic
  checkUsernameUnique(this.str, function (err) {
    if (err)
      return done(err);
    return done();
  });
}
```

### Property dependency example
The following example validates 'emailprovider' after 'email' been sanitized. 
By using **parallel: false** validations run in series.
```javascript
var schema = mongoose.Schema({
    email: String,
    emailprovider: String
}).
    plugin(avalidator, {
      parallel: false,
      validate: {
        email: function (done) {
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
        },
        emailprovider: function () {
            var matches = this.model.email.match(/^[^@]+@([^\.]+)\.([^\.]{3}$)/),
                provider = Array.isArray(matches) ? matches[1] : '';
            this.check({
                equals: 'provider not match: %1'
            }).
                equals(provider);
        }
      }
    });
```
