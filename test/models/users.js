exports.dataModel = {
	uid: String,
	timestamp: Number,
	name: { _type: String, unique: true },
	password: { _type: String, encrypted: true }
};
