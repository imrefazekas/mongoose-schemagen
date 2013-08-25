var should = require('should');
var schemagen = require('../lib/mongoose-schemagen');
var path = require('path');

exports.group = {
	testRead: function(test){
		var env = schemagen.readModels( {}, path.resolve( './test/models' ) );

		env.should.have.property('users');
		env.should.have.property('services');

		test.done();
	}
};