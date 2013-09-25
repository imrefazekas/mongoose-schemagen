var _ = require('underscore');
var fs = require('fs');

var mongoose = require('mongoose');
require('mongoose-function')(mongoose);

function isNumber(obj) {
	return _.isNumber(obj) || !isNaN(obj);
}

exports.readModels = function(env, folder, recursive){
	var environment = env || {};
	var path = folder || './';
	var files = fs.readdirSync( path );
	_.each( files, function(file, index, list){
		var fullPath = path + '/' + file;
		var isDirectory = fs.lstatSync(fullPath).isDirectory();
		var isFile = fs.lstatSync(fullPath).isFile();

		if( isFile && file.indexOf('.js', file.length-3) !== -1 ){
			var name = file.substring( 0, file.length-3 );
			environment[ name ] = require( folder + '/' + file );
		}

		if( recursive && isDirectory ){
			exports.readModels( env, fullPath );
		}
	} );
	return environment;
};


exports.generateSchema = function(object, options){
	var self = { };

	var mongoSchema = function(prototype){
		var _GenerateSchema = function( _prototype, _schema ){
			_.each( _prototype, function(value, key, list){
				if( _.isArray( value ) ){
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
					if( !options.ignoreFunction )
						_schema[key] = Function;
				}
				else if( _.isObject( value ) || (value === mongoose.Schema.Types.Mixed) ){
					if( _.keys(value).length === 0 )
						_schema[key] = mongoose.Schema.Types.Mixed;
					else{
						_schema[key] = {};
						_GenerateSchema( value, _schema[key] );
					}
				}
			});
			return _schema;
		};

		_GenerateSchema( prototype, self );

		return self;
	}(object);

	return new mongoose.Schema( mongoSchema, options );
};

exports.generate = function(object, validation, schemaoptions, modelOptions){
	var schema = exports.generateSchema(object, schemaoptions);
	var model = mongoose.model( modelOptions.name, schema);

	model.prototype.validator = modelOptions.validator;
	model.prototype.validationRules = function(){ return validation ? validation : {}; };
	model.prototype.saveWithValidation = function( callback ){
		var rules = this.validationRules();

		if( this.validator ){
			var res = this.validator( this, rules );
			if( res && _.keys( res ).length>0 )
				throw new Error( 'Validation error occurred:' + JSON.stringify(res) );
		}

		this.save( callback );
	};

	return { model: model, schema: schema };
};
