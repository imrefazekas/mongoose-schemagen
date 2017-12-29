let Assigner = require('assign.js')
let assigner = new Assigner()

let Clerobee = require('clerobee')
let clerobee = new Clerobee( 16 )

let modelTypes = [
	'Boolean', 'DateIso', 'Email', 'Number', 'Object', 'Phone', 'Text', 'Timestamp', 'URL', 'Geo',
	'Array of Strings', 'Array of Nums', 'Array of Bools', 'Array of Objs', 'Array of Geo'
]

function createAttribute ( attribute, defaultValue ) {
	return {
		_type: String,
		_unique: !!attribute.unique,
		_encrypted: !!attribute.sealed,
		_required: !!attribute.required,
		value: attribute.defaultValue || defaultValue
	}
}

function convertAttribute ( attribute ) {
	switch ( attribute.dataType ) {
	case 'Geo':
	case 'Array of Geo': return {
		_type: { type: String },
		coordinates: []
	}

	case 'DateIso': return assigner.assign( { _type: Date }, createAttribute( attribute ) )

	case 'Email':
	case 'Phone':
	case 'Text':
	case 'URL': return assigner.assign( { _type: String }, createAttribute( attribute, '' ) )

	case 'Boolean': return assigner.assign( { _type: Boolean }, createAttribute( attribute, false ) )

	case 'Number':
	case 'Timestamp': return assigner.assign( { _type: Number, _date: attribute.dataType === 'Timestamp' }, createAttribute( attribute, 0 ) )

	case 'Object': return assigner.assign( attribute.defaultValue || {}, { _encrypted: !!attribute.sealed, _required: !!attribute.required } )

	case 'Array of Strings': return assigner.assign( { _type: [ String ] }, createAttribute( attribute, '' ) )
	case 'Array of Nums': return assigner.assign( { _type: [ Number ] }, createAttribute( attribute, '' ) )
	case 'Array of Bools': return assigner.assign( { _type: [ Boolean ] }, createAttribute( attribute, '' ) )

	case 'Array of Objs': return assigner.assign( { _type: [ {} ] }, createAttribute( attribute, '' ) )
	}
}

function _create ( name, value ) {
	let idx = {}
	idx[ name ] = value
	return idx
}

module.exports = {
	modelTypes: modelTypes,
	parseModel: function ( aModel ) {
		let model = {}
		for ( let attribute of aModel.attributes ) {
			model[ attribute.name ] = convertAttribute( attribute )
		}
		return model
	},
	ensureIndexing: function ( aModel, schema ) {
		let index = { }
		for ( let attribute of aModel.attributes ) {
			if ( attribute.dataType === 'Geo' || attribute.dataType === 'Array of Geo' )
				schema.index( _create( attribute.name, '2dsphere' ), {
					name: 'idx_' + attribute.name
				} )
			else if ( attribute.indexed ) {
				index[ attribute.name ] = attribute.dataType === 'Number' ? 1 : 'text'
			}
		}
		if ( Object.keys(index).length > 0) {
			schema.index( index, {
				name: 'idx_attributes'
			} )
		}
	}
}
