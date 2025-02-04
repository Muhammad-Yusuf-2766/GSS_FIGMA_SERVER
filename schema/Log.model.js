const mongoose = require('mongoose')


const mqttEventSchema = new mongoose.Schema({
	gw_number: {
		type: String,
		required: true
	},
	doorNum: {
		type: Number,
		required: true
	},
	doorChk: {
		type: Number,
		required: true
	},
	betChk: {
		type: Number,
		required: true
	},
	createdAt: { 
    type: Date, 
    default: Date.now 
  } 
})

const MqttEventSchema = mongoose.model('Log', mqttEventSchema)
module.exports = MqttEventSchema
