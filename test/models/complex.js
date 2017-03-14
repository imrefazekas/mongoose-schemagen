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
	},
	idcard: {
		_encrypted: true,
		serialID: '',
		issuedAt: 0
	},
	plateNumber: { _type: Number, _encrypted: true, value: 12 }
};
