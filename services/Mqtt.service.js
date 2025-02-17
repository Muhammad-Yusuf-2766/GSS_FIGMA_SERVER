const mqtt = require('mqtt')
const NodeHistorySchema = require('../schema/History.model')
const NodeSchema = require('../schema/Node.model')
const EventEmitter = require('events')
const { notifyUsersOfOpenDoor } = require('../services/Telegrambot.service')

// Xabarlarni tarqatish uchun EventEmitter
const mqttEmitter = new EventEmitter()

const nodeTopic = [
	'GSSIOT/01030369081/GATE_PUB/+',
	'GSSIOT/01030369081/GATE_RES/+',
]
const Topic = 'GSSIOT/01030369081/GATE_PUB/'
const gwResTopic = 'GSSIOT/01030369081/GATE_RES/'

let isMessageListenerAdded = false // Listenerning qo'shilganligini tekshirish uchun flag

// ================= MQTT LOGICS =============== //

const mqttClient = mqtt.connect('mqtt://gssiot.iptime.org:10200', {
	username: '01030369081',
	password: 'qwer1234',
	// connectTimeout: 30 * 1000,
})

mqttClient.on('connect', () => {
	console.log('Connected to GSSIOT MQTT server')
	nodeTopic.forEach(topic => {
		mqttClient.subscribe(topic, function (err) {
			if (!err) {
				console.log('Subscribed to:', topic)
			} else {
				console.log('Error subscribing:', err)
			}
		})
	})
})

mqttClient.removeAllListeners('message')
mqttClient.on('message', async (topic, message) => {
	const data = JSON.parse(message.toString())
	const serialNumber = topic.split('/').pop().slice(-4) // Mavzudan UUID ni olish
	console.log(`MQTT_data ${serialNumber}: ${message}`)

	if (topic.startsWith(Topic)) {
		const eventData = {
			gw_number: serialNumber,
			doorNum: data.doorNum,
			doorChk: data.doorChk,
			betChk: data.betChk,
		}

		const updateData = {
			doorChk: data.doorChk,
			betChk: data.betChk,
			...(data.betChk_2 !== undefined && { betChk_2: data.betChk_2 }),
		}
		const updatedNode = await NodeSchema.findOneAndUpdate(
			{ doorNum: data.doorNum },
			{ $set: updateData },
			{ new: true }
		)

		const mqttEventSchema = new NodeHistorySchema(eventData)
		await mqttEventSchema.save()
		mqttEmitter.emit('mqttMessage', updatedNode)

		// ==== Qo'shimcha: Eshik ochiq bo'lsa, bog'langan userlarga Telegram xabar yuborish ====
		if (data.doorChk === 1) {
			// 1 -> eshik ochildi deb faraz qilamiz
			await notifyUsersOfOpenDoor(data.doorNum)
		}
	} else if (topic.startsWith(gwResTopic)) {
		console.log('Gateway-creation event:', data)
		emitGwRes(data)
	}
})

mqttClient.on('error', error => {
	console.error('MQTT connection error:', error)
})

const emitGwRes = data => {
	mqttEmitter.emit('gwPubRes', data)
}

module.exports = { mqttEmitter, mqttClient }
