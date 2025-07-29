const mongoose = require('mongoose')
const { gateway_type_enums } = require('../lib/config')

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
		default: [],
		// validate: {
		// 	validator: function (nodesArray) {
		// 		return nodesArray.length > 0 // Ensure array is not empty
		// 	},
		// 	message: 'At least one node must be present in the nodes array',
		// },
	},
	angle_nodes: {
		type: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Angle-Node',
			},
		],
		required: false,
		default: [],
	},
	gateway_status: {
		type: Boolean,
		required: false,
		default: true,
	},
	gateway_type: {
		type: String,
		required: [true, 'Gateway type is required'],
		default: 'NODE_GATEWAY',
		enum: {
			values: gateway_type_enums,
			message: '{VALUE} is not among permitted gateway types',
		},
	},
	building_id: {
		type: mongoose.Schema.ObjectId,
		default: null,
		ref: 'Building',
	},
})

const Gateway = mongoose.model('Gateway', gatewaySchema)
module.exports = Gateway
