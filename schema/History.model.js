const mongoose = require('mongoose')

const NodeHistorySchema = new mongoose.Schema({
	gw_number: {
		type: String,
		required: true,
	},
	doorNum: {
		type: Number,
		required: true,
	},
	doorChk: {
		type: Number,
		required: true,
	},
	betChk: {
		type: Number,
		required: false,
		default: 0,
	},
	betChk_2: {
		type: Number,
		required: false,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

const NodesHistory = mongoose.model('NodesHistory', NodeHistorySchema)
module.exports = NodesHistory
