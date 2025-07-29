const mqtt = require('mqtt')
const NodeHistorySchema = require('../schema/History.model')
const NodeSchema = require('../schema/Node.model')
const EventEmitter = require('events')
const { notifyUsersOfOpenDoor } = require('../services/Telegrambot.service')
const AngleNodeHistory = require('../schema/Angle.node.history.model')
const AngleNodeSchema = require('../schema/Angle.node.model')

// Xabarlarni tarqatish uchun EventEmitter
const mqttEmitter = new EventEmitter()

const allTopics = [
	'GSSIOT/01030369081/GATE_PUB/+',
	'GSSIOT/01030369081/GATE_RES/+',
	'GSSIOT/01030369081/GATE_ANG/+',
]
const nodeTopic = 'GSSIOT/01030369081/GATE_PUB/'
const angleTopic = 'GSSIOT/01030369081/GATE_ANG/'
const gwResTopic = 'GSSIOT/01030369081/GATE_RES/'
const EPSILON = 0.1 // yoki kerakli sezgirlik darajasi
// ================= MQTT LOGICS =============== //

const mqttClient = mqtt.connect('mqtt://gssiot.iptime.org:10200', {
	username: '01030369081',
	password: 'qwer1234',
	// connectTimeout: 30 * 1000,
})

mqttClient.on('connect', () => {
	console.log('Connected to GSSIOT MQTT server')
	allTopics.forEach(topic => {
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
	try {
		const data = JSON.parse(message.toString())
		const gatewayNumber = topic.split('/').pop().slice(-4) // Mavzudan UUID ni olish
		// console.log(`MQTT_data ${gatewayNumber}: ${message}`)
		// ====== Hozrgi vaqtni olish ======= //
		const now = new Date()

		const timeString = now.toLocaleString('ko-KR', {
			timeZone: 'Asia/Seoul',
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})

		if (topic.startsWith(nodeTopic)) {
			console.log('Door-Node mqtt message:', data, '|', timeString)
			const eventData = {
				gw_number: gatewayNumber,
				doorNum: data.doorNum,
				doorChk: data.doorChk,
				betChk: data.betChk_3,
			}

			const updateData = {
				doorChk: data.doorChk,
				betChk: data.betChk_3,
				...(data.betChk_2 !== undefined && { betChk_2: data.betChk_2 }),
			}

			const updatedNode = await NodeSchema.findOneAndUpdate(
				{ doorNum: data.doorNum },
				{ $set: updateData },
				{ new: true }
			)

			if (!updatedNode) {
				console.warn('Node topilmadi:', data.doorNum)
				return
			}

			const mqttEventSchema = new NodeHistorySchema(eventData)

			try {
				await mqttEventSchema.save()
			} catch (err) {
				console.warn('NodeHistorySchema saqlashda xatolik:', err.message)
				return
			}

			mqttEmitter.emit('mqttMessage', updatedNode)

			// Eshik ochilganda TELEGRAM ga message sending (uncomment to activate function)
			if (data.doorChk === 1) {
				await notifyUsersOfOpenDoor(data.doorNum)
			}
		} else if (topic.startsWith(gwResTopic)) {
			console.log(
				`Gateway-creation event gateway-${gatewayNumber}:`,
				data,
				'|',
				timeString
			)
			emitGwRes(data)
		} else if (topic.startsWith(angleTopic)) {
			console.log(
				`MPU-6500 sensor data from gateway-${gatewayNumber}:`,
				data,
				'|',
				timeString
			)

			const updateData = {
				angle_x: data.angle_x,
				angle_y: data.angle_y,
			}

			const historyData = {
				gw_number: gatewayNumber,
				doorNum: data.doorNum,
				angle_x: data.angle_x,
				angle_y: data.angle_y,
			}

			// Oldingi ma'lumotni topish
			const existing = await AngleNodeSchema.findOne({ doorNum: data.doorNum })

			if (
				Math.abs(existing.angle_x - data.angle_x) > EPSILON ||
				Math.abs(existing.angle_y - data.angle_y) > EPSILON
			) {
				// Faqat o‘zgargan bo‘lsa yangilaydi va history saqlaydi
				const updatedAngleNode = await AngleNodeSchema.findOneAndUpdate(
					{ doorNum: data.doorNum },
					{ $set: updateData },
					{ new: true, upsert: true }
				)

				const result = new AngleNodeHistory(historyData)
				await result.save()

				mqttEmitter.emit('mqttAngleMessage', updatedAngleNode)
			} else {
				console.log(
					`⏩ Skip: angle_x va angle_y avvalgisi bilan bir xil (${existing.angle_x}, ${existing.angle_y})`
				)
			}
		}
	} catch (err) {
		console.error('MQTT xabarda xatolik:', err.message)
	}
})

mqttClient.on('error', error => {
	console.error('MQTT connection error:', error)
})

const emitGwRes = data => {
	mqttEmitter.emit('gwPubRes', data)
}

module.exports = { mqttEmitter, mqttClient }
