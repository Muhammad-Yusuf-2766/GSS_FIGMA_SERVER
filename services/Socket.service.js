const BuildingSchema = require('../schema/Building.model')
const GatewaySchema = require('../schema/Gateway.model')
const { mqttEmitter } = require('./Mqtt.service')

let io

const returnBuildingId = async gateway_id => {
	const gateway = await GatewaySchema.findById(gateway_id)
	console.log(gateway)

	return gateway.building_id
}

const setupSocket = serverIo => {
	io = serverIo

	mqttEmitter.on('mqttMessage', async updatedNode => {
		const { gateway_id } = updatedNode
		const buildingId = await returnBuildingId(gateway_id)
		if (buildingId) {
			// console.log('Socket emitting:', serialNumber, data)
			io.emit(`mqttNodeData`, updatedNode)
		}
	})

	io.on('connection', socket => {
		console.log(`New SOCKET user connected: ${socket.id}`)

		// Foydalanuvchi buildingni subscribe qilmoqchi
		socket.on('subscribeToBuilding', buildingId => {
			console.log(`Client subscribed to building: ${buildingId}`)
			socket.join(`building_${buildingId}`)
		})

		// Foydalanuvchi uzilib qolganda
		socket.on('disconnect', () => {
			console.log(`SOCKET user disconnected: ${socket.id}`)
		})
	})
}

module.exports = { setupSocket }
