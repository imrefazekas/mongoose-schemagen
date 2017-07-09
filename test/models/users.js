exports.dataModel = {
	uid: String,
	timestamp: Number,
	name: { _type: String, _unique: true },
	password: { _type: String }
};
