let _ = require('isa.js')

let crypto = require('crypto')
let algorithm = 'aes-256-cbc'
let pass = 'abrakadabra'

function encrypt (text, password) {
	var cipher = crypto.createCipher(algorithm, password)
	var crypted = cipher.update(text, 'utf8', 'hex')
	crypted += cipher.final('hex')
	return crypted
}

function decrypt (text, password) {
	var decipher = crypto.createDecipher(algorithm, password)
	var dec = decipher.update(text, 'hex', 'utf8')
	dec += decipher.final('utf8')
	return dec
}

function collectEncryptedFields ( emph, _prototype, path ) {
	path = path ? path + '.' : ''
	for ( let key of Object.keys( _prototype ) ) {
		let value = _prototype[key]
		if ( _.isObject( value ) ) {
			if ( value._encrypted )
				emph[ path + key ] = value
			else collectEncryptedFields( emph, value, path + key )
		}
	}
	return emph
}

let hw = encrypt('hello world', pass)

console.log( decrypt(hw, pass) )

let Person = {
	name: { _type: String, _encrypted: true, value: 'Phil' },
	age: 12,
	address: {
		_encrypted: true,
		city: 'London'
	},
	hobbies: {
		public: {
			biking: true
		},
		private: {
			_encrypted: true,
			ironing: true
		}
	}
}
console.log( collectEncryptedFields( {}, Person, '' ) )
