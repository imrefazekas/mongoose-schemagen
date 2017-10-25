var mongoose = require('mongoose')
mongoose.Promise = Promise

var Schema = mongoose.Schema
var async = require('async')

var schemagen = require('../lib/mongoose-schemagen')

var uri = 'mongodb://localhost/GeoTest'
var opts = { server: { auto_reconnect: true }, db: { safe: true, fsync: true } }

function cleanup ( Location ) {
	Location.remove( function () {
		mongoose.disconnect()
	})
}

function queryFactory ( Location ) {
	var coords = {type: 'Point', coordinates: [-5, 5]}
	Location.find({loc: {$near: coords}}).limit(1).exec(function (err, res) {
		if (err) throw err

		console.log('Closest to %s is %s', JSON.stringify(coords), res)
		cleanup( Location )
	})
}

function mongooseFactory () {
	var LocationObject = {
		loc: {
			_type: {type: String},
			coordinates: []
		}
	}

	var Location = schemagen.generate( mongoose, LocationObject, null, {}, { name: 'Location', schemaCreated: function (schema) {
		schema.index( { loc: '2dsphere' } )
	} } ).model

	var data = [
		{loc: {type: 'Point', coordinates: [-20.0, 5.0]}},
		{loc: {type: 'Point', coordinates: [6.0, 10.0]}},
		{loc: {type: 'Point', coordinates: [34.0, -50.0]}},
		{loc: {type: 'Point', coordinates: [-100.0, 70.0]}},
		{loc: {type: 'Point', coordinates: [38.0, 38.0]}}
	]
	async.each(data, function (item, cb) {
		Location.create(item, cb)
	}, function (err) {
		if (err) throw err

		setTimeout( function () {
			queryFactory( Location )
		}, 2000 )
	})

}

mongoose.connect( uri, opts )
var db = global.db = mongoose.connection

db.on('error', function (err) {
	console.error( err )
} )
db.on('open', function () {
	mongooseFactory()
} )
