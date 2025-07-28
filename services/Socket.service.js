const GatewaySchema = require('../schema/Gateway.model')
const { mqttEmitter } = require('./Mqtt.service')

let io

const returnGateway = async gateway_id => {
	const gateway = await GatewaySchema.findById(gateway_id)
	return gateway
}

const setupSocket = serverIo => {
	io = serverIo
	// ============ NODES MQTT data delivering field ========== //
	mqttEmitter.on('mqttMessage', async updatedNode => {
		const { gateway_id } = updatedNode
		const gateway = await returnGateway(gateway_id)
		if (gateway) {
			const buildingId = gateway.building_id
			const topic = `mqtt/building/${buildingId}`
			io.emit(topic, updatedNode)
		}
	})

	// ============ 비계전도 MQTT data delivering field ========== //
	mqttEmitter.on('mqttAngleMessage', async newdAngleData => {
		const { gateway_id } = newdAngleData
		const gateway = await returnGateway(gateway_id)
		if (gateway) {
			const buildingId = gateway.building_id
			const topic = `${buildingId}_angle-nodes`
			io.emit(topic, newdAngleData)
		}
	})

	io.on('connection', socket => {
		console.log(`New SOCKET user connected: ${socket.id}`)
		socket.on('disconnect', () => {
			console.log(`SOCKET user disconnected: ${socket.id}`)
		})
	})
}

module.exports = { setupSocket }
