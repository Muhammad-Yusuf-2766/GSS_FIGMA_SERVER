const NodeSchema = require('../schema/Node.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')
const { mqttClient, mqttEmitter } = require('./Mqtt.service')
const fileService = require('./file.service')

class ProductService {
	constructor() {
		this.nodeSchema = NodeSchema
		this.gatewaySchema = GatewaySchema
		this.buildingSchema = BuildingSchema
	}

	// =============================== Product creating & geting logics ================================== //

	async createNodesData(dataArray) {
		try {
			const existNodes = await this.nodeSchema.find({
				doorNum: { $in: dataArray.map(data => data.doorNum) },
			})
			if (existNodes.length > 0) {
				const existNodeNums = existNodes.map(node => node.doorNum)
				throw new Error(
					`노드 번호가 ${existNodeNums.join(',')}인 기존 노드가 있습니다 !`
				)
			}

			const result = await this.nodeSchema.insertMany(dataArray)
			return result
		} catch (error) {
			throw new Error(`Error: ${error.message}`)
		}
	}

	async createGatewayData(data) {
		try {
			// exsting gateway checkng logic
			const existGateway = await this.gatewaySchema.findOne({
				serial_number: data.serial_number,
			})
			if (existGateway) {
				throw new Error(
					`일련 번호가 ${existGateway.serial_number}인 기존 게이트웨이가 있습니다. `
				)
			}
			const gateway = new this.gatewaySchema(data)

			// gateway Mqtt publish logic
			const gw_number = data.serial_number
			const nodesId = data.nodes
			const nodes = await this.nodeSchema.find(
				{ _id: { $in: nodesId } },
				{ doorNum: 1, _id: 0 }
			)

			let topic = `GSSIOT/01030369081/GATE_SUB/GRM22JU22P${gw_number}`

			const publishData = {
				cmd: 2,
				numNodes: nodes.length,
				nodes: nodes.map(node => node.doorNum),
			}
			console.log('Publish-data:', publishData, topic)

			// 3. MQTT serverga muvaffaqiyatli yuborilishini tekshirish
			if (mqttClient.connected) {
				const publishPromise = new Promise((resolve, reject) => {
					mqttClient.publish(topic, JSON.stringify(publishData), err => {
						if (err) {
							reject(new Error(`MQTT publishing failed for topic: ${topic}`))
						} else {
							resolve(true)
						}
					})
				})
				// Publish'ning natijasini kutamiz
				await publishPromise

				const mqttResponsePromise = new Promise((resolve, reject) => {
					mqttEmitter.once('gwPubRes', data => {
						if (data.resp === 'success') {
							resolve(true)
						} else {
							reject(new Error('Failed publishing gateway to mqtt'))
						}
					})

					// Javob kutilayotgan vaqtda taymer qo'shing
					setTimeout(() => {
						reject(new Error('MQTT response timeout'))
					}, 5000) // Masalan, 5 soniya kutish
				})

				await mqttResponsePromise
			} else {
				throw new Error('MQTT client is not connected')
			}

			await this.nodeSchema.updateMany(
				{ _id: { $in: nodesId } },
				{ $set: { node_status: false, gateway_id: gateway._id } }
			)
			const result = await gateway.save()
			return result
		} catch (error) {
			throw new Error(`Error on creating-gateway: ${error.message}`)
		}
	}

	async getGatewaysData() {
		try {
			const gateways = await this.gatewaySchema.find()
			if (!gateways || gateways.length == 0) {
				throw new Error('There is no any gateways in database :(')
			}
			return gateways
		} catch (error) {
			throw error
		}
	}

	async getActiveGatewaysData() {
		try {
			const gateways = await this.gatewaySchema.find({ gateway_status: true })
			if (!gateways || gateways.length == 0) {
				return []
			}
			return gateways
		} catch (error) {
			throw error
		}
	}

	async getNodesData() {
		try {
			const nodes = await this.nodeSchema.find()
			if (!nodes || nodes.length == 0) {
				throw new Error('There is no any nodes in database :(')
			}
			return nodes
		} catch (error) {
			throw error
		}
	}

	async getActiveNodesData() {
		try {
			const nodes = await this.nodeSchema.find({ node_status: true })
			if (!nodes || nodes.length == 0) {
				return []
			}
			return nodes
		} catch (error) {
			throw error
		}
	}

	async getProductData(id) {
		try {
			const result = await this.ProductSchema.findById(id)
			return result
		} catch (error) {
			throw new Error('Error on fetching Product by id')
		}
	}

	// =============================== Product changing logic ================================== //

	async updateNodeStatusData(nodeId) {
		try {
			const updatingNode = await this.nodeSchema.findOneAndUpdate(
				{ _id: nodeId },
				[{ $set: { node_status: { $not: '$node_status' } } }], // Boolean qiymatni teskarisiga o‘girish
				{ new: true } // Yangilangan ma'lumotni qaytarish
			)

			if (!updatingNode) {
				throw new Error('Node not found')
			}

			return updatingNode
		} catch (error) {
			throw error
		}
	}

	async deleteNodeData(nodeId) {
		try {
			const deletingNode = await this.nodeSchema.findOneAndDelete({
				_id: nodeId,
			})
			if (!deletingNode) {
				throw new Error('Node not found')
			}

			return deletingNode
		} catch (error) {
			console.error('Error deleting node:', error)
			throw error
		}
	}

	async updateGatewayStatusData(gatewayId) {
		try {
			const updatingGateway = await this.gatewaySchema.findOneAndUpdate(
				{ _id: gatewayId },
				[{ $set: { gateway_status: { $not: '$gateway_status' } } }], // Boolean qiymatni teskarisiga o‘girish
				{ new: true } // Yangilangan ma'lumotni qaytarish
			)

			if (!updatingGateway) {
				throw new Error('Node not found')
			}

			return updatingGateway
		} catch (error) {
			throw error
		}
	}

	async deleteGatewayData(gatewayId) {
		try {
			// Gateway mavjudligini tekshirish
			const gateway = await this.gatewaySchema.findById(gatewayId)
			if (!gateway) {
				throw new Error('Gateway not found')
			}

			// Gateway ichidagi node'larni olish
			const nodeIds = gateway.nodes

			// Agar node mavjud bo'lsa, ularni yangilash
			if (nodeIds.length > 0) {
				await this.nodeSchema.updateMany(
					{ _id: { $in: nodeIds } },
					{ $set: { node_status: true } }
				)
			} else {
				throw new Error('Gateway does not contain any nodes')
			}

			// Gateway'ni o‘chirish
			const deletingGateway = await this.gatewaySchema.findOneAndDelete({
				_id: gatewayId,
			})
			if (!deletingGateway) {
				throw new Error('Gateway not found or already deleted')
			}

			// Yangilangan Gateway'larni qaytarish
			const updatedGateways = await this.gatewaySchema.find()
			return updatedGateways
		} catch (error) {
			console.error('Error deleting gateway:', error)
			throw error
		}
	}

	async setNodesPositionData(nodesPosition, buildingId, file) {
		try {
			// Har bir element uchun alohida yangilash
			const updatePromises = nodesPosition.map(async item => {
				const result = await this.nodeSchema.updateMany(
					{ doorNum: item.nodeNum }, // doorNum'ga mos keladigan node'larni yangilash
					{ $set: { position: item.position } } // Har bir node uchun o'zining `position`ini yangilash
				)
				return {
					doorNum: item.nodeNum, // ✅ nodeNum qaytarilyapti
					matchedCount: result.matchedCount,
					modifiedCount: result.modifiedCount,
				}
			})

			const results = await Promise.all(updatePromises)

			// ✅ Topilmagan node'larni ajratib olish
			const noUpdates = results
				.filter(res => res.matchedCount === 0)
				.map(res => res.doorNum) // ✅ Faqat `doorNum` qaytarilyapti

			if (noUpdates.length > 0) {
				return {
					state: 'fail',
					message: `${noUpdates} 번 노드가 발견되지 않았습니다. 파일을 확인하세요!`,
				}
			}

			// file va folderName ni kiritish kerak
			const fileName = fileService.save(file, 'exels')

			const building = await this.buildingSchema.findById(buildingId)
			if (building) {
				const oldFilename = building.nodes_position_file

				if (oldFilename && oldFilename.trim() !== '') {
					fileService.delete(oldFilename)
				}

				await this.buildingSchema.findByIdAndUpdate(
					buildingId,
					{ nodes_position_file: fileName },
					{ new: true }
				)
			}

			return {
				message: `${nodesPosition.length}개 노드가 성공적으로 배치되었습니다.`,
			}
		} catch (error) {
			console.error('Error on node positioning:', error)
			throw new Error('Error on node positioning.') // ✅ Yangi `Error` obyektini qaytarish
		}
	}
}

module.exports = ProductService
