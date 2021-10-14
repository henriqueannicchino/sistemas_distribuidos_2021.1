 
const mongoose = require('mongoose');

const MissingOnesSchema = new mongoose.Schema({
	createdAt:{
		type: Date,
		default: Date.now,
		required: true
	},

	_id: mongoose.Schema.Types.ObjectId,
	userId:{
		type: Number,
		required: true
	},
	missingName: {
		type: String,
		required: true
	},
	missingDay: {
		type: String,
		required: true
	},
	image: {
		type: String,
		required: true
	},
	longitude: {
		type: Number,
		required: true
	},
	latitude: {
		type: Number,
		required: true
	}
});

const MissingOnes = mongoose.model('MissingOnes', MissingOnesSchema);

module.exports = MissingOnes;