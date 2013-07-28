var mongoose = require('mongoose');

before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-validator', done);
});

after(function (done) {
    mongoose.connection.close(done);
});
