const mongoose = require('mongoose')

const angleNodeSchema = new mongoose.Schema(
	{
		doorNum: {
			type: Number,
			required: true,
			index: { unique: true, sparse: true }, // This already creates the unique index
		},
		angle_x: {
			type: Number,
			required: false,
			default: 0,
		},
		angle_y: {
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
	},
	{ timestamps: true }
)

const AngleNodeSchema = mongoose.model('Angle-Node', angleNodeSchema)
module.exports = AngleNodeSchema // Export the model instance, not the schema
