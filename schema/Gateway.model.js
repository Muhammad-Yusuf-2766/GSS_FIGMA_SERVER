const mongoose = require('mongoose')

const gatewaySchema = new mongoose.Schema({
	serial_number: {
		type: String,
		required: true,
		index: { unique: true, sparse: true },
	},
	nodes: {
		type: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Node',
			},
		],
		required: true,
		validate: {
			validator: function (nodesArray) {
				return nodesArray.length > 0 // Ensure array is not empty
			},
			message: 'At least one node must be present in the nodes array',
		},
	},
	gateway_status: {
		type: Boolean,
		required: false,
		default: true,
	},
	building_id: {
		type: mongoose.Schema.ObjectId,
		default: null,
		ref: 'Building',
	},
})

const Gateway = mongoose.model('Gateway', gatewaySchema)
module.exports = Gateway
