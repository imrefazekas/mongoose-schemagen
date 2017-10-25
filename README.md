[![NPM](https://nodei.co/npm/mongoose-schemagen.png)](https://nodei.co/npm/mongoose-schemagen/)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[mongoose-schemagen](https://github.com/imrefazekas/mongoose-schemagen) is a very small utility library allowing to generate validable [mongoose](http://mongoosejs.com) schemas from pure JS objects.

Features:
- generates [mongoose](http://mongoosejs.com) schema by a JS object
- generates model
- extends model's _save_ function with validation
- support indexing, unique constraint and value encryption
- instance and static Model functions

By using this library, you will be free from the load of schema and model creation and every record you might want to create and store will be validated against the rules passed by. Use it well! :)

In the example, the rules follow the syntax of [Vindication.js](https://github.com/imrefazekas/vindication.js) which is a great library to be used on both client and server side for validation.

This project is designed to support complex business models shared between client and server-side opening the code for the  sharing of model, validation and computation functions.

License: [MIT](http://www.opensource.org/licenses/mit-license.php)


##Usage
```javascript
// require the lib
let schemagen = require('mongoose-schemagen')
// require the lib which can iterpret the validation rules. vindication.js is used in this example.
let vindication = require('vindication.js')

// have a prototype model. The business logic object will look like this.
let prototype = {
	password: {
		_type: String,
		_encrypted: true
	},
	uid: { _type: String, _unique: true },
	firstName: 'Planet',
	lastName: 'Earth',
	fullName: function() {
		return this.firstName() + ' ' + this.lastName()
	}
}


// define some rules as validation constraints
let rules = {
	firstName: { required: true, type: 'number' },
	lastName: { minlength: '1', type: 'alphanum' }
}

// create schema and model. The returning object possesses the mongoose model and the schema as well.
let gen = schemagen.generate(
	prototype,
	{
		firstName: { required: true, type: 'number' },
		lastName: { minlength: '1', type: 'alphanum' }
	},
	{ collection: 'Docs' },
	{ name: 'Doc', validator: vindication.validate }
)
let model = gen.model

// create a mongoose record by some JS object
let record = new model( prototype )

// save the record with validation. In case of validation issues, an Error will be thrown.
record.save()
```

And that's it!
