const mongoose = require('mongoose')

const clientSchema = new mongoose.Schema({
	client_name: {
		type: String,
		required: true,
	},
	client_addr: {
		type: String,
		required: true,
	},
	client_buildings: {
		type: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Building',
			},
		],
		validate: [val => val.length > 0, 'At least one building is required.'],
	},
	boss_users: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: true,
		},
	],
	client_status: {
		type: Boolean,
		required: false,
		default: true,
	},
})

const Client = mongoose.model('Client', clientSchema)
module.exports = Client
