var should = require('should');
var schemagen = require('../lib/mongoose-schemagen');
var vindication = require('vindication.js');

var prototype = {
	firstName: "Planet",
	lastName: "Earth",
	fullName: function() {
		return this.firstName() + " " + this.lastName();
	}
};

exports.group = {
	testHead: function(test){
		var obj = schemagen.generate(
			prototype,
			{
				firstName: { required: true, type: "number" },
				lastName: { notblank: true, type: "alphanum" }
			},
			{ collection: 'Docs' },
			{ name: 'Doc', validator: vindication.validate }
		);
		var model = obj.model;

		var record = new model( prototype );

		(function(){
			record.saveWithValidation();
		}).should.throwError(/^Validation.*/);

		test.done();
	}
};