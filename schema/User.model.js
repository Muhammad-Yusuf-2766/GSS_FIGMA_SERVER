const { Schema, model } = require('mongoose')

const userSchema = new Schema({
	user_name: {
		type: String,
		required: true,
	},
	user_email: {
		type: String,
		required: true,
		index: { unique: true, sparse: true },
	},
	user_password: {
		type: String,
		required: true,
		select: false,
	},
	user_phone: {
		type: Number,
		required: true,
		index: { unique: true, sparse: true },
	},
	user_title: {
		type: String,
		required: false,
		default: null,
	},
	user_type: {
		type: String,
		required: false,
		enum: ['USER', 'BOSS', 'ADMIN'],
		default: 'USER',
	},
	telegram_id: {
		type: String,
		required: false,
		default: '',
	},
})

const User = model('User', userSchema)
module.exports = User
