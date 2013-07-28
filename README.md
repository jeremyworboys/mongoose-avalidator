mongoose-avalidator
==================

A mongoose middleware for [node-validator](https://github.com/chriso/node-validator).
Unlike some similar packages, it:
* Supports asynchronous validation.
* Supports sanitize (Filter)
* Inherits node-validator's API convention.

## Quick Examples

### Config schema to use mongoose-avalidator
```javascript
var validator = require('mongoose-avalidator');
var schema = mongoose.Schema({
  foo: String
}).plugin(validator.init(), {
  foo: function () {
    this.value = this.sanitize.entityDecode();
    this.check({
        isNumeric: 'This is not a number',
        contains: 'The value doesn\'t have a 0 in it'
    }).isNumeric().contains('0');
  }
});
```

### Use node-validator in validation function
Basiclly because every validation function is mapped to a document property, the first argument to 'check' and 'sanitize' is omitted.

node-validator|mongoose-avalidator
--- | --- | ---
check('string', 'Required!').notNull()|this.check('Required!').notNull()
var result = sanitize('string').trim()|this.value = this.sanitize.trim()

You can get/set mapped property's value by using **this.value**.

### Synchronous validation function example
Function has no argument.
```javascript
function () {
  //sanitize
  this.value = this.sanitize.trim();

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
  this.value = this.sanitize.trim();

  //validate
  this.check({
    notNull: 'Username is required.',
    regex: 'Username is invalid'
  }).
    notNull().
    regex('^[a-zA-Z0-9_]+$');

  //asynchronous validation logic
  checkUsernameUnique(this.value, function (err) {
    if (err)
      return done(err);
    return done();
  });
}
```
