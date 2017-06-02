var mongoose = require('mongoose')
mongoose.Promise = Promise

var Schema = mongoose.Schema
var async = require('async')

var uri = 'mongodb://ec2-34-250-27-165.eu-west-1.compute.amazonaws.com/C8Geo' // int
// var uri = 'mongodb://ec2-34-250-110-180.eu-west-1.compute.amazonaws.com/C8Geo' // prod
// var uri = 'mongodb://ec2-34-250-163-167.eu-west-1.compute.amazonaws.com/C8Geo' // qa
var opts = { server: { auto_reconnect: true }, db: { safe: true, fsync: true } }

function cleanup ( Location ) {
	mongoose.disconnect()
	/*
	Location.remove( function () {
		mongoose.disconnect()
	})
	*/
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
	var LocationObject = new Schema( {
		country: String,
		city: String,
		count: Number,
		loc: {
			type: {type: String},
			coordinates: []
		}
	} )
	LocationObject.index( {loc: '2dsphere'} )

	var Location = mongoose.model('Location', LocationObject)

	Location.remove( function () {
		var data = [
			{ country: 'France', city: 'Paris', count: 10, loc: {type: 'Point', coordinates: [-20.0, 5.0]}},
			{ country: 'France', city: 'Lyon', count: 10, loc: {type: 'Point', coordinates: [6.0, 10.0]}},
			{ country: 'France', city: 'Montpellier', count: 10, loc: {type: 'Point', coordinates: [34.0, -50.0]}},
			{ country: 'France', city: 'Nice', count: 10, loc: {type: 'Point', coordinates: [-100.0, 70.0]}},
			{ country: 'France', city: 'Grass', count: 10, loc: {type: 'Point', coordinates: [38.0, 38.0]}}
		]
		async.each(data, function (item, cb) {
			Location.create(item, cb)
		}, function (err) {
			if (err) throw err

			setTimeout( function () {
				queryFactory( Location )
			}, 2000 )
		})
	} )
}

mongoose.connect( uri, opts )
var db = global.db = mongoose.connection

db.on('error', function (err) {
	console.error( err )
} )
db.on('open', function () {
	mongooseFactory()
} )
