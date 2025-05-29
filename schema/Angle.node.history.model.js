const mongoose = require('mongoose')

const AngleNodeHistorySchema = new mongoose.Schema({
	gw_number: {
		type: String,
		required: true,
	},
	doorNum: {
		type: Number,
		required: true,
	},
	angle_x: {
		type: Number,
		required: true,
	},
	angle_y: {
		type: Number,
		required: false,
		default: 0,
	},
	position: {
		type: String,
		required: false,
		default: '',
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

const AngleNodeHistory = mongoose.model(
	'AngleNodeHistory',
	AngleNodeHistorySchema
)
module.exports = AngleNodeHistory
