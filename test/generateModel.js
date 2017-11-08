let subject = {
	lastModified: -1,
	description: 'Representation of the data subject',
	attributes: [ {
		name: 'uid',
		description: '',
		dataType: 'Text',
		sensitive: true,
		personal: true,
		sealed: true,
		unique: true,
		indexed: true,
		generated: true,
		fixed: true,
		defaultValue: '',
		pseudoFn: 'return clerobee.generate(8)',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	/* {
		name: 'sid',
		description: '',
		type: 'Text',
		sensitive: true,
		personal: true,
		sealed: true,
		unique: false,
		indexed: true,
		generated: false,
		fixed: true,
		defaultValue: '',
		pseudoFn: 'return clerobee.generate(8)',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	}, */
	{
		name: 'exp_uid',
		description: '',
		dataType: 'Text',
		sensitive: false,
		personal: true,
		sealed: false,
		unique: true,
		indexed: true,
		generated: true,
		fixed: true,
		defaultValue: '',
		pseudoFn: 'return clerobee.generate(8)',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'timestamp',
		description: '',
		dataType: 'Timestamp',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: false,
		indexed: false,
		generated: true,
		fixed: true,
		defaultValue: '-1',
		pseudoFn: 'return -1',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'consent',
		description: '',
		dataType: 'Object',
		sensitive: true,
		personal: true,
		sealed: false,
		unique: false,
		indexed: false,
		generated: false,
		fixed: true,
		defaultValue: [Object],
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'active',
		description: '',
		dataType: 'Boolean',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: false,
		indexed: false,
		generated: false,
		fixed: true,
		defaultValue: 'true',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'authID',
		description: '',
		dataType: 'Text',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: true,
		indexed: false,
		generated: true,
		fixed: true,
		defaultValue: '',
		pseudoFn: 'return clerobee.generate(8)',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'authKey',
		description: '',
		dataType: 'Text',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: true,
		indexed: false,
		generated: true,
		fixed: true,
		defaultValue: '',
		pseudoFn: 'return clerobee.generate(8)',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'email',
		description: '',
		dataType: 'Text',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: false,
		indexed: true,
		generated: false,
		fixed: true,
		defaultValue: '',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'phone',
		description: '',
		dataType: 'Text',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: false,
		indexed: false,
		generated: false,
		fixed: true,
		defaultValue: '',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	},
	{
		name: 'loc',
		description: '',
		dataType: 'Geo',
		sensitive: false,
		personal: false,
		sealed: false,
		unique: false,
		indexed: true,
		generated: false,
		fixed: true,
		defaultValue: '',
		uid: '',
		timestamp: -1,
		active: true,
		validation: [Object],
		access: [Object]
	} ],
	access: {
		confidant: {
			pseudo: false,
			minimised: false,
			write: true
		},
		dpo: {
			pseudo: false,
			minimised: false,
			write: true
		},
		controller: {
			pseudo: false,
			minimised: false,
			write: true
		},
		processor: {
			pseudo: false,
			minimised: false,
			write: true
		},
		thirdparty: {
			pseudo: false,
			minimised: false,
			write: false
		},
		recipient: {
			pseudo: false,
			minimised: false,
			write: false
		},
		manager: {
			pseudo: false,
			minimised: false,
			write: false
		},
		developer: {
			pseudo: false,
			minimised: false,
			write: true
		},
		deployer: {
			pseudo: false,
			minimised: false,
			write: false
		},
		tester: {
			pseudo: false,
			minimised: false,
			write: true
		},
		analyser: {
			pseudo: false,
			minimised: false,
			write: false
		},
		marketer: {
			pseudo: false,
			minimised: false,
			write: false
		}
	},
	uid: '',
	sid: '',
	timestamp: -1,
	name: 'Subject',
	fixed: false,
	active: true
}

let Clerobee = require('clerobee')
let clerobee = new Clerobee( 256 )

let Gemerator = require('../lib/mongoose-schemagen')

let mongoose = require('mongoose')
mongoose.Promise = Promise

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, ' .... reason:', reason)
})


let schemagen = require('../lib/mongoose-schemagen')

let uri = 'mongodb://localhost/ModelTest'
let opts = { useMongoClient: true, keepAlive: true }

mongoose.connect( uri, opts )
let db = global.db = mongoose.connection

db.on('error', function (err) {
	console.error( err )
} )
db.on('open', async function () {
	let model = Gemerator.parseModel( subject )

	try {
		let SubjectModel = schemagen.generate( mongoose, model, null, {}, {
			name: subject.name,
			timeStamped: true,
			encryption: { secret: clerobee.generate() },
			schemaCreated: function (schema) {
				Gemerator.ensureIndexing( subject, schema )
			}
		} ).model
	} catch (err) { console.error(err) }
} )
