exports.dataModel = {
	password: {
		_type: String,
		unique: true,
		encrypted: true
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
