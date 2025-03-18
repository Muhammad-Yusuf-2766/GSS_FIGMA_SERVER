const mongoose = require('mongoose')

const buildingSchema = new mongoose.Schema({
	building_name: {
		type: String,
		required: true,
		trim: true,
	},
	building_num: {
		type: Number,
		required: true,
	},
	building_addr: {
		type: String,
		required: true,
	},
	building_status: {
		type: Boolean,
		required: false,
		default: true,
	},
	gateway_sets: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'Gateway',
			required: true,
			default: [],
		},
	],
	users: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: false,
			default: [],
		},
	],
	permit_date: {
		type: Date,
		required: false, // Amal qilish muddati ko'rsatilsin
		default: null, // Hozirgi sanani o'rnatadi
	},
	expiry_date: {
		type: Date,
		required: false, // Amal qilish muddati ko'rsatilsin
		default: null,
	},
	client_id: {
		type: mongoose.Schema.ObjectId,
		default: null,
		ref: 'Client',
	},
	nodes_position_file: {
		type: String,
		default: '',
	},
})

// ===  Bu qator bitta documentda quyidagi keylarning valulari bir xil bo'lmasligi uchun. shu 3 ta keyning value lari oldin kiritilgan va yana bir xil value lar kiritlib saqlansa xatolik beradi.
buildingSchema.index(
	{ building_name: 1, building_num: 1, building_addr: 1 },
	{ unique: true }
)

const Building = mongoose.model('Building', buildingSchema)
module.exports = Building
