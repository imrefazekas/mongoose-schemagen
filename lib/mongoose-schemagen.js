'use strict';

var _ = require('isa.js');
var fs = require('fs');
var async = require('async');

var bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

function isNumber(obj) {
	return _.isNumber(obj) || !isNaN(obj);
}

exports.readModels = function(env, folder, recursive){
	var environment = env || {};
	var path = folder || './';
	var files = fs.readdirSync( path );
	files.forEach( function(file, index, list){
		var fullPath = path + '/' + file;
		var isDirectory = fs.lstatSync(fullPath).isDirectory();
		var isFile = fs.lstatSync(fullPath).isFile();

		if( isFile && file.indexOf('.js', file.length-3) !== -1 ){
			var name = file.substring( 0, file.length-3 );
			environment[ name ] = require( folder + '/' + file );
		}

		if( recursive && isDirectory ){
			exports.readModels( env, fullPath );
		}
	} );
	return environment;
};


exports.generateSchema = function(mongoose, prototype, options){
	var _GenerateSchema = function( _prototype, _schema ){
		for ( let key of Object.keys( _prototype ) ){
			var value = _prototype[key];
			if( Array.isArray( value ) ){
				if( value.length === 0 )
					_schema[key] = [];
				else if( _.isString( value[0] ) || (value[0] === String) )
					_schema[key] = [ String ];
				else if( _.isBoolean( value[0] ) || (value[0] === Boolean) )
					_schema[key] = [ Boolean ];
				else if( isNumber( value[0] ) || (value[0] === Number) )
					_schema[key] = [ { type: Number } ];
				else if( _.isDate( value[0] ) || (value[0] === Date) )
					_schema[key] = [ { type: Date } ];
				else if( _.isObject( value[0] ) ){
					_schema[key] = [ {} ];
					_GenerateSchema( value[0], _schema[key][0] );
				}
			}
			else if( _.isString( value ) || (value === String) ){
				_schema[key] = String;
			}
			else if( _.isBoolean( value ) || (value === Boolean) ){
				_schema[key] = Boolean;
			}
			else if( isNumber( value ) || (value === Number) ){
				_schema[key] = { type: Number };
			}
			else if( _.isDate( value ) || (value === Date) ){
				_schema[key] = { type: Date };
			}
			else if( _.isFunction( value ) || (value === Function) ){
				if( options.allowFunction )
					_schema[key] = Function;
			}
			else if( _.isObject( value ) ){
				if( value._type ){
					_schema[key] = {
						type: value._type,
						required: !!value.required
					};
					if( value.indexed )
						_schema[key].index = true;
					else if( value.unique )
						_schema[key].index = {
							unique: true
						};
				}
				else if( value.fn || (value.read && value.write) ){
					if( options.allowFunction )
						_schema[key] = { fn: Function };
				} else if( Object.keys(value).length === 0  || ( Object.keys(value).length === 1 && value._observable) )
					_schema[key] = mongoose.Schema.Types.Mixed;
				else if( value._transient )
					;
				else{
					_schema[key] = {};
					_GenerateSchema( value, _schema[key] );
				}
			}
		}
		return _schema;
	};

	var schema = _GenerateSchema( prototype, {} );

	return new mongoose.Schema( schema, options );
};




var encryptedFields = function( object, array, root ){
	for ( let key of Object.keys( object ) ){
		var ref = root + (root?'.':'') + key;
		var value = object[key];
		if(
			Array.isArray( value ) ||
			_.isString( value ) || (value === String) ||
			_.isBoolean( value ) || (value === Boolean) ||
			_.isNumber( value ) || (value === Number) ||
			_.isDate( value ) || (value === Date) ||
			_.isFunction( value ) || (value === Function)
		){
			continue;
		}
		else if( _.isObject( value ) ){
			if( value._type ){
				if( value.encrypted )
					array.push( ref );
			}
			else if(
				value.fn || (value.read && value.write) ||
				Object.keys(value).length === 0  || ( Object.keys(value).length === 1 && value._observable) ||
				value._transient
			)
				continue;
			else{
				encryptedFields( object[key], array, root + (root?'.':'') + key );
			}
		}
	}
	return array;
};
function get( object, reference ){
	var path = reference.split('.');
	var ref = object;
	for( let i=0; i<path.length; ++i )
		ref = ref[ path[i] ];
	return ref;
}
function set( object, reference, value ){
	var path = reference.split('.');
	var ref = object;
	for( let i=0; i<path.length; ++i )
		if( i===path.length-1 )
			ref[ path[i] ] = value;
		else
			ref = ref[ path[i] ];
	return value;
}
function capitalize( str ){
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function namify( path ){
	return path.split('.').map( function( value ){ return capitalize(value); } ).join('');
}
exports.generate = function(mongoose, object, validation, schemaoptions, modelOptions){
	var schema = exports.generateSchema(mongoose, object, schemaoptions);

	schema.statics.encryptedFields = encryptedFields( object, [], '' );
	if( modelOptions.timeStamped || schema.statics.encryptedFields > 0 ){

		schema.statics.encryptedFields.forEach( function( field ){
			schema.methods[ 'compare' + namify(field) ] = function(candidateValue, cb) {
				bcrypt.compare(candidateValue, get(this, field), function(err, isMatch) {
				if (err) return cb(err);
					cb(null, isMatch);
				});
			};
		});
		schema.pre('save', true, function (next, done) {
			var record = this;

			var fns = [];
			schema.statics.encryptedFields.forEach( function( field ){
				console.log( field, record.isModified( field ) );
				if (!record.isModified( field )) return;
				fns.push(function(cb){
					bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
						if (err) return cb(err);

						bcrypt.hash( get(record, field), salt, function (err, hash) {
							if (err) return cb(err);

							set(record, field, hash);
							cb();
						});
					});
				});
			} );
			console.log( fns.length );
			async.series( fns, function(err, res){
				next( err );

				var error;
				if( modelOptions.timeStamped ){
					if(record.creationFunt)
						record.creationFunt(record);
					record.timestamp = Date.now();
					if( record.validator ){
						var vRes = record.validator( record, record.validationRules() );
						if( vRes && Object.keys( vRes ).length>0 )
							error = new Error( 'Validation error(s) occurred:' + JSON.stringify(vRes) );
					}
				}

				done( error );
			} );
		});
	}

	var model = mongoose.model( modelOptions.name, schema);

	model.prototype.validator = modelOptions.validator;
	model.prototype.validationRules = function(){ return validation ? validation : {}; };

	model.prototype.timeStamped = modelOptions.timeStamped;
	model.prototype.creationFunt = modelOptions.creationFunt;

	return { model: model, schema: schema };
};
