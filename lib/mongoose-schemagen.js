'use strict'

let _ = require('isa.js')
let fs = require('fs')
let crypto = require('crypto')

function isNumber (obj) {
	return _.isNumber(obj) || !isNaN(obj)
}

function set ( object, reference, value ) {
	let path = reference.split('.')
	let ref = object
	for ( let i = 0; i < path.length; ++i )
		if ( i === path.length - 1 )
			ref[ path[i] ] = value
		else
			ref = ref[ path[i] ]
	return value
}

function encrypt (text, algorithm, password) {
	var cipher = crypto.createCipher( algorithm, password )
	var crypted = cipher.update(text, 'utf8', 'hex')
	crypted += cipher.final('hex')
	return crypted
}

function decrypt (text, algorithm, password) {
	var decipher = crypto.createDecipher( algorithm, password )
	var dec = decipher.update(text, 'hex', 'utf8')
	dec += decipher.final('utf8')
	return dec
}

function collectEncryptedFields ( emph, _prototype, object, path ) {
	path = path ? path + '.' : ''

	if (!object || !_.isObject( object ) ) return emph

	for ( let key of Object.keys( _prototype ) ) {
		let protoValue = _prototype[key]
		if ( _.isObject( protoValue ) ) {
			if ( protoValue._encrypted ) {
				emph[ path + key ] = JSON.parse( JSON.stringify( object[key] ) )
				object[key] = null
			}
			else collectEncryptedFields( emph, protoValue, object[key], path + key )
		}
	}
	return emph
}

function defineEncryptedFields ( emph, _prototype, path ) {
	path = path ? path + '.' : ''
	for ( let key of Object.keys( _prototype ) ) {
		let value = _prototype[key]
		if ( _.isObject( value ) ) {
			if ( value._encrypted )
				emph[ path + key ] = value
			else defineEncryptedFields( emph, value, path + key )
		}
	}
	return emph
}

exports.readModels = function (env, folder, recursive) {
	let environment = env || {}
	let path = folder || './'
	let files = fs.readdirSync( path )
	files.forEach( function (file, index, list) {
		let fullPath = path + '/' + file
		let isDirectory = fs.lstatSync(fullPath).isDirectory()
		let isFile = fs.lstatSync(fullPath).isFile()

		if ( isFile && file.indexOf('.js', file.length - 3) !== -1 ) {
			let name = file.substring( 0, file.length - 3 )
			environment[ name ] = require( folder + '/' + file )
		}

		if ( recursive && isDirectory ) {
			exports.readModels( env, fullPath )
		}
	} )
	return environment
}


exports.generateMethods = function (schema, prototype, options) {
	options = options || {}
	if ( options.services )
		for ( let key of Object.keys( options.services ) ) {
			let value = options.services[key]
			if ( _.isFunction( value ) || (value === Function) ) {
				schema.methods[key] = value
			}
		}
	if ( options.statics )
		for ( let key of Object.keys( options.statics ) ) {
			let value = options.statics[key]
			if ( _.isFunction( value ) || (value === Function) ) {
				schema.statics[key] = value
			}
		}

	return schema
}

let innerKeys = [ 'index', 'indexed', 'unique', '_type' ]
exports.generateSchema = function (mongoose, prototype, options) {
	let _GenerateSchema = function ( _prototype, _schema ) {
		for ( let key of Object.keys( _prototype ) ) {
			let value = _prototype[key]
			if ( key === '_encrypted' ) continue
			else if ( key === '_vault' ) _schema[key] = String
			else if ( Array.isArray( value ) ) {
				if ( value.length === 0 )
					_schema[key] = []
				else if ( _.isString( value[0] ) || (value[0] === String) )
					_schema[key] = [ String ]
				else if ( _.isBoolean( value[0] ) || (value[0] === Boolean) )
					_schema[key] = [ Boolean ]
				else if ( isNumber( value[0] ) || (value[0] === Number) )
					_schema[key] = [ { type: Number } ]
				else if ( _.isDate( value[0] ) || (value[0] === Date) )
					_schema[key] = [ { type: Date } ]
				else if ( _.isObject( value[0] ) ) {
					_schema[key] = [ {} ]
					_GenerateSchema( value[0], _schema[key][0] )
				}
			}
			else if ( _.isString( value ) || (value === String) ) {
				_schema[key] = String
			}
			else if ( _.isBoolean( value ) || (value === Boolean) ) {
				_schema[key] = Boolean
			}
			else if ( isNumber( value ) || (value === Number) ) {
				_schema[key] = { type: Number }
			}
			else if ( _.isDate( value ) || (value === Date) ) {
				_schema[key] = { type: Date }
			}
			else if ( _.isFunction( value ) || (value === Function) ) {
			}
			else if ( _.isObject( value ) ) {
				// if ( value._encrypted ) delete value._encrypted
				if ( value._type ) {
					_schema[key] = {
						type: value._type,
						required: !!value.required
					}
					if ( value.index )
						_schema[key].index = value.index
					else if ( value.indexed )
						_schema[key].index = true
					else if ( value.unique )
						_schema[key].index = {
							unique: true
						}
					let iKeys = Object.keys( value ).filter( (key) => { return !innerKeys.includes( key ) } )
					iKeys.forEach( (iKey) => {
						_schema[key][ iKey ] = value[ iKey ]
					} )
				}
				else if ( value.fn || (value.read && value.write) ) {
				} else if ( Object.keys(value).length === 0 || ( Object.keys(value).length === 1 && value._observable) )
					_schema[key] = mongoose.Schema.Types.Mixed
				else if ( value._transient ) {

				}
				else {
					_schema[key] = {}
					_GenerateSchema( value, _schema[key] )
				}
			}
		}
		return _schema
	}

	let schema = _GenerateSchema( prototype, {} )

	return new mongoose.Schema( schema, options )
}

exports.generate = function (mongoose, object, validation, schemaoptions, modelOptions) {
	let vault = defineEncryptedFields( {}, object, '' )
	let needEncryption = Object.keys( vault ).length > 0

	if ( needEncryption && (!modelOptions.encryption || !modelOptions.encryption.secret) ) throw new Error('Secret key needs to be passed for the encrypted fields defined.')

	if ( needEncryption )
		object._vault = String

	let schema = exports.generateMethods( exports.generateSchema(mongoose, object, schemaoptions), object, schemaoptions)

	schema.statics.protoObject = object
	schema.statics.vault = vault
	schema.statics.needEncryption = needEncryption

	if ( modelOptions.timeStamped || schema.statics.hashedFields > 0 ) {
		schema.post( 'init', function (doc) {
			if (doc._vault) {
				try {
					let vault = JSON.parse( decrypt( doc._vault, modelOptions.encryption.algorithm || 'aes-256-cbc', modelOptions.encryption.secret ) )
					for ( let key of Object.keys( vault ) ) {
						set( doc, key, vault[ key ] )
					}
					doc._vault = null
				} catch (err) { console.error(err) }
			}
		} )
		schema.pre('save', true, function (next, done) {
			let record = this

			next( )

			if ( schema.statics.needEncryption ) {
				let vault = collectEncryptedFields( {}, schema.statics.protoObject, record, '' )
				record._vault = encrypt( JSON.stringify( vault ), modelOptions.encryption.algorithm || 'aes-256-cbc', modelOptions.encryption.secret )
			}

			let error
			if (record.creationFunt)
				record.creationFunt(record)
			if ( modelOptions.timeStamped )
				record.timestamp = Date.now()
			if ( record.validator ) {
				let vRes = record.validator( record, record.validationRules() )
				if ( vRes && Object.keys( vRes ).length > 0 )
					error = new Error( 'Validation error(s) occurred:' + JSON.stringify(vRes) )
			}

			done( error )
		})
	}

	if (modelOptions.schemaCreated)
		modelOptions.schemaCreated( schema )

	let model = mongoose.model( modelOptions.name, schema)

	model.prototype.validator = modelOptions.validator
	model.prototype.validationRules = function () { return validation || {} }

	model.prototype.timeStamped = modelOptions.timeStamped
	model.prototype.creationFunt = modelOptions.creationFunt

	return { model: model, schema: schema }
}
