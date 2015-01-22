var should = require("chai").should();
var schemagen = require('../lib/mongoose-schemagen');
var vindication = require('vindication.js');
var path = require('path');

var mongoose = require('mongoose');

describe("schemagen", function () {

	var prototype = {
		firstName: "Planet",
		lastName: "Earth",
		fullName: function() {
			return this.firstName() + " " + this.lastName();
		}
	};

	before(function(done){
		var host = process.env.MONGODB_DEVELOPMENT_HOST || 'localhost';
		var port = process.env.MONGODB_DEVELOPMENT_PORT || 27017;
		var poolSize = 5;
		var user = process.env.MONGODB_DEVELOPMENT_USER;
		var pass = process.env.MONGODB_DEVELOPMENT_PASSWORD;
		var dbName = process.env.MONGODB_DEVELOPMENT_DB || 'test';

		var uri = 'mongodb://' + (user ? user + ':' + pass + '@' : '' )  + host + ':' + port + '/' + dbName;
		var opts = { server: { auto_reconnect: true, poolSize: poolSize }, db:{ safe:true, fsync:true }, user: user, pass: pass };

		mongoose.connect( uri, opts );

		var db = global.db = mongoose.connection;

		db.on('error', function (err) {
			done( err );
		} );
		db.on('open', function() {
			done();
		} );
	});

	describe("test integration", function () {
		it('reading models', function(done){
			var env = global.models = schemagen.readModels( {}, path.resolve( './test/models' ) );

			env.should.have.property('users');
			env.should.have.property('services');
			env.should.have.property('complex');

			done();
		});

		it('storing record', function(done){
			var obj = schemagen.generate(
				mongoose,
				prototype,
				{
					firstName: { required: true, type: "number" },
					lastName: { minlength: "1", type: "alphanum" }
				},
				{ collection: 'Docs' },
				{
					name: 'Doc', validator: vindication.validate, timeStamped: true, creationFunt: function(record){
						return record;
					}
				}
			);
			var Model = obj.model;

			var record = new Model( prototype );

			record.save( function(err, res){
				should.exist(err);
				done( );
			} );
		});

		it('storing complex', function(done){
			var obj = schemagen.generate(
				mongoose,
				global.models.complex.dataModel,
				{ },
				{ collection: 'Complex' },
				{ name: 'Complex', timeStamped: true, creationFunt: function(record){ return record; } }
			);
			var Model = obj.model;

			var record = new Model( {
				body:{
					data: 'D',
					content: 'C'
				},
				additional:{
					some: 'S',
					text: 'T'
				}
			} );

			record.save( function(err, res){
				done( err );
			} );
		});
	});

	after(function(done){
		mongoose.connection.close( function(){ console.log('Mongo stopped'); done(); } );
	});

});
