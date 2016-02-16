[![NPM](https://nodei.co/npm/mongoose-schemagen.png)](https://nodei.co/npm/mongoose-schemagen/)

[mongoose-schemagen](https://github.com/imrefazekas/mongoose-schemagen) is a very small utility library allowing to generate validable [mongoose](http://mongoosejs.com) schemas from pure JS objects.

Features:
- generates [mongoose](http://mongoosejs.com) schema by a JS object
- generates model
- extends model's _save_ function with validation
- support indexing, unique constraint and value encryption

By using this library, you will be free from the load of schema and model creation and every record you might want to create and store will be validated against the rules passed by. Use it well! :)

In the example, the rules follow the syntax of [Vindication.js](https://github.com/imrefazekas/vindication.js) which is a great library to be used on both client and server side for validation.

This project is designed to support complex business models shared between client and server-side opening the code for the  sharing of model, validation and computation functions.

License: [MIT](http://www.opensource.org/licenses/mit-license.php)


##Usage
```javascript
// require the lib
var schemagen = require('mongoose-schemagen');
// require the lib which can iterpret the validation rules. vindication.js is used in this example.
var vindication = require('vindication.js');

// have a prototype model. The business logic object will look like this.
var prototype = {
	password: {
		_type: String,
		encrypted: true
	},
	uid: { _type: String, unique: true },
	firstName: "Planet",
	lastName: "Earth",
	fullName: function() {
		return this.firstName() + " " + this.lastName();
	}
};


// define some rules as validation constraints
var rules = {
	firstName: { required: true, type: "number" },
	lastName: { minlength: "1", type: "alphanum" }
}

// create schema and model. The returning object possesses the mongoose model and the schema as well.
var gen = schemagen.generate(
	prototype,
	{
		firstName: { required: true, type: "number" },
		lastName: { minlength: "1", type: "alphanum" }
	},
	{ collection: 'Docs' },
	{ name: 'Doc', validator: vindication.validate }
);
var model = gen.model;

// create a mongoose record by some JS object
var record = new model( prototype );

// save the record with validation. In case of validation issues, an Error will be thrown.
record.saveWithValidation();
```

And that's it!
