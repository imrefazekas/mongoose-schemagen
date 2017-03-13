exports.dataModel = {
	password: {
		_type: String,
		unique: true,
		hashed: true
	},
	geo: {
		_type: [ Number ],
		index: '2d'
	},
	body: {
		data: '',
		content: ''
	},
	additional: {
		some: '',
		text: { _type: String }
	}
};
