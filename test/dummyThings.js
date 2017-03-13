'use strict';

var _ = require('isa.js');

var hashedFields = function( object, array, root ){
	for ( let key of Object.keys( object ) ){
		var ref = root + '.' + key;
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
				if( value.hashed )
					array.push( ref );
			}
			else if(
				value.fn || (value.read && value.write) ||
				Object.keys(value).length === 0  || ( Object.keys(value).length === 1 && value._observable) ||
				value._transient
			)
				continue;
			else{
				hashedFields( object[key], array, root + (root?'.':'') + key );
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

var obj = {
	almafa: {
		alma: {
			almafa: {
				_type: String,
				hashed: true
			}
		}
	}
};

console.log( namify('password') );
console.log( namify('password.almafa') );

var fields = hashedFields( obj, [], '' );
fields.forEach( function(field){
	console.log(
		get( obj, field ),
		set( obj, field, 'dummy' ),
		obj
	);
} );
