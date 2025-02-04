const mongoose = require('mongoose')

const nodeSchema = new mongoose.Schema({
	doorNum: {
		type: Number,
		required: true,
		index: { unique: true, sparse: true }, // This already creates the unique index
	},
	doorChk: {
		type: Number,
		required: false,
		default: 0,
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
	node_status: {
		type: Boolean,
		required: false,
		default: true, // true means available
	},
	position: {
		type: String,
		default: '',
	},
	gateway_id: {
		type: mongoose.Schema.ObjectId,
		default: null,
		ref: 'Gateway',
	},
})

const Node = mongoose.model('Node', nodeSchema)
module.exports = Node // Export the model instance, not the schema
