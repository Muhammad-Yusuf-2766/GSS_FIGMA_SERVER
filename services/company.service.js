const ClientSchema = require('../schema/Company.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')
const NodeSchema = require('../schema/Node.model')
const AngleNodeSchema = require('../schema/Angle.node.model')
const AngleNodeHistorySchema = require('../schema/Angle.node.history.model')
const { mqttClient, mqttEmitter } = require('./Mqtt.service')

class CompanyService {
	constructor() {
		this.clientSchema = ClientSchema
		this.gatewaySchema = GatewaySchema
		this.buildingSchema = BuildingSchema
		this.nodeSchema = NodeSchema
		this.angleNodeSchema = AngleNodeSchema
		this.angleNodesHistory = AngleNodeHistorySchema
	}

	async createBuildingData(data) {
		try {
			// Sanalarni Date obyektiga aylantirish
			if (data.permit_date) {
				data.permit_date = new Date(data.permit_date)
			}
			if (data.expiry_date) {
				data.expiry_date = new Date(data.expiry_date)
			}

			const existBuilding = await this.buildingSchema.findOne({
				building_name: data.building_name,
				building_num: data.building_num,
			})

			if (existBuilding) {
				throw new Error(
					`${existBuilding.building_name.toUpperCase()}건설에는 이미 같은 ${
						existBuilding.building_num
					}호 건물이 있습니다. 다른 번호를 입력해 주세요.`
				)
			}

			// Transactionni boshlash
			const session = await this.buildingSchema.startSession()
			session.startTransaction()

			try {
				// Step 2: Building saving
				const building = new this.buildingSchema(data)
				const result = await building.save({ session })

				// Step 2: Update product_status for gateways in gateway_sets
				await this.gatewaySchema.updateMany(
					{ _id: { $in: data.gateway_sets } },
					{ $set: { gateway_status: false, building_id: building._id } },
					{ session }
				)

				await session.commitTransaction()
				session.endSession()

				return result
			} catch (innerError) {
				// Transactionni bekor qilish
				await session.abortTransaction()
				session.endSession()
				throw new Error(
					`Error on updating gateways or saving building: ${innerError.message}`
				)
			}
		} catch (error) {
			throw new Error(`Error on creating-building: ${error.message}`)
		}
	}

	async getActiveBuildingsData() {
		try {
			const buildings = await this.buildingSchema.find({
				building_status: true,
			})
			if (!buildings || buildings.length == 0) {
				return []
			}
			return buildings
		} catch (error) {
			throw error
		}
	}

	async getBuildingsData() {
		try {
			const buildings = await this.buildingSchema.find()
			if (!buildings || buildings.length == 0) {
				return []
			}
			return buildings
		} catch (error) {
			throw error
		}
	}

	async createClientData(data) {
		try {
			// Transactionni boshlash
			const session = await this.clientSchema.startSession()
			session.startTransaction()

			try {
				// Step 1: Client saving
				const client = new this.clientSchema(data)
				const result = await client.save({ session })

				// Step 2: Update `building_status` va `client_id`
				const updateResult = await this.buildingSchema.updateMany(
					{ _id: { $in: data.client_buildings } }, // 🛠 TO'G'RI FIELD NOMI!
					{ $set: { building_status: false, client_id: client._id } },
					{ session }
				)

				// Transactionni yakunlash
				await session.commitTransaction()
				session.endSession()

				return result
			} catch (innerError) {
				// Xatolik bo‘lsa, transactionni bekor qilish
				await session.abortTransaction()
				session.endSession()
				throw new Error(`Error on updating buildings: ${innerError.message}`)
			}
		} catch (error) {
			throw new Error(`Error on creating company: ${error.message}`)
		}
	}

	async getCompanies() {
		try {
			const result = await this.clientSchema.find()

			return result
		} catch (error) {
			throw new Error('Error on fetching companies')
		}
	}

	async getCompanyData(clientId) {
		try {
			const client = await this.clientSchema.findOne({ _id: clientId })
			const buildings = await this.buildingSchema
				.find({ client_id: clientId })
				.sort({ building_num: 1 })
			return { client, buildings }
		} catch (error) {
			throw new Error('Error on fetching company by id')
		}
	}

	async deleteCompanyData(clientId) {
		try {
			// 1. Clientni topish va uning ichidagi client_buildings array'ni olish
			const client = await this.clientSchema.findById(clientId)
			if (!client) {
				throw new Error('Client not found')
			}

			// 2. client_buildings ichidagi barcha buildingId larni olish
			const buildingIds = client.client_buildings

			// 3. Barcha buildinglarning statusini true ga o'zgartirish
			await this.buildingSchema.updateMany(
				{ _id: { $in: buildingIds } }, // buildingId lar bo‘yicha qidirish
				{ $set: { building_status: true } } // building_status ni true qilish
			)

			// 4. Clientni o‘chirish
			await this.clientSchema.findByIdAndDelete(clientId)

			return { message: 'Client o‘chirildi uning binolari yangilandi.' }
		} catch (error) {
			console.error(error)
			throw new Error('Error on deleting company by id')
		}
	}

	async getBuildingNodesData(buildingId) {
		try {
			const gateways = await this.gatewaySchema.find({
				building_id: buildingId,
			})

			if (!gateways.length) {
				throw new Error('No gateways found for this building')
			}

			const gatewayIds = gateways.map(gateway => gateway._id)

			const nodes = await this.nodeSchema
				.find({
					gateway_id: { $in: gatewayIds },
				})
				.sort({ doorNum: 1 })

			const building = await this.buildingSchema.findOne({ _id: buildingId })

			if (!building) {
				throw new Error('Building not found')
			}
			if (!nodes || nodes.length === 0) {
				throw new Error('No nodes found for this building')
			}

			return { building, nodes }
		} catch (error) {
			// Errorni ushlash
			console.error('Error in getBuildingNodesData:', error.message)
			throw error // Asl xatoni qaytaramiz
		}
	}

	async getBuildingAngleNodesData(buildingId) {
		try {
			const gateways = await this.gatewaySchema.find({
				building_id: buildingId,
			})

			if (!gateways.length) {
				throw new Error('No gateways found for this building')
			}

			const gatewayIds = gateways.map(gateway => gateway._id)

			const angleNodes = await this.angleNodeSchema
				.find({
					gateway_id: { $in: gatewayIds },
				})
				.sort({ doorNum: 1 })

			// const promises = angleNodes.map(async node => {
			// 	// 1. Eng oxirgi tarixiy yozuvni topish
			// 	const latestHistory = await this.angleNodesHistory
			// 		.findOne({ doorNum: node.doorNum })
			// 		.sort({ createdAt: -1 })

			// 	console.log(latestHistory)

			// 	// Agar history mavjud bo'lsa, yangilash
			// 	if (latestHistory) {
			// 		const { angle_x, angle_y } = latestHistory

			// 		// 2. AngleNodeSchema dagi hujjatni yangilash
			// 		await this.angleNodeSchema.updateOne(
			// 			{ _id: node._id },
			// 			{
			// 				$set: {
			// 					angle_x,
			// 					angle_y,
			// 				},
			// 			}
			// 		)
			// 	}
			// })

			// await Promise.all(promises) // Barchasini kutish

			// 			const updatedNodes = await this.angleNodeSchema
			// 	.find({
			// 		gateway_id: { $in: gatewayIds },
			// 	})
			// 	.sort({ doorNum: 1 })

			const building = await this.buildingSchema.findOne({ _id: buildingId })

			if (!building) {
				throw new Error('Building not found')
			}
			if (!angleNodes || angleNodes.length === 0) {
				throw new Error('No nodes found for this building')
			}

			return { building, angleNodes }
		} catch (error) {
			// Errorni ushlash
			console.error('Error on getBuildingNodesData:', error.message)
			throw error // Asl xatoni qaytaramiz
		}
	}

	async getAngleNodesSummaryData(buildingId) {
		try {
			const gateways = await this.gatewaySchema.find({
				building_id: buildingId,
			})

			if (!gateways.length) {
				throw new Error('No gateways found for this building')
			}

			const gatewayIds = gateways.map(gateway => gateway._id)

			const angleNodes = await this.angleNodeSchema
				.find({
					gateway_id: { $in: gatewayIds },
				})
				.sort({ doorNum: 1 })

			const promises = angleNodes.map(async item => {
				const maxAngleX = await this.angleNodesHistory
					.findOne({ doorNum: item.doorNum })
					.sort({ angle_x: -1 })
					.limit(1)

				const minAngleX = await this.angleNodesHistory
					.findOne({ doorNum: item.doorNum })
					.sort({ angle_x: 1 })
					.limit(1)

				const maxAngleY = await this.angleNodesHistory
					.findOne({ doorNum: item.doorNum })
					.sort({ angle_y: -1 })
					.limit(1)

				const minAngleY = await this.angleNodesHistory
					.findOne({ doorNum: item.doorNum })
					.sort({ angle_y: 1 })
					.limit(1)

				return {
					doorNum: item.doorNum,
					maxAngleX,
					minAngleX,
					maxAngleY,
					minAngleY,
				}
			})

			const result = await Promise.all(promises)

			return { result }
		} catch (error) {
			// Errorni ushlash
			console.error('Error on getBuildingNodesData:', error.message)
			throw error // Asl xatoni qaytaramiz
		}
	}

	async deleteBuildingData(buildingId) {
		try {
			// 1. Clientni topish va uning ichidagi client_buildings array'ni olish
			const building = await this.buildingSchema.findById(buildingId)
			if (!building) {
				throw new Error('Client not found')
			}

			// 2. client_buildings ichidagi barcha buildingId larni olish
			const gatewayIds = building.gateway_sets

			// 3. Barcha buildinglarning statusini true ga o'zgartirish
			await this.gatewaySchema.updateMany(
				{ _id: { $in: gatewayIds } }, // buildingId lar bo‘yicha qidirish
				{ $set: { gateway_status: true } } // building_status ni true qilish
			)

			// 4. Clientni o‘chirish
			await this.buildingSchema.findByIdAndDelete(buildingId)

			return { message: 'Client o‘chirildi uning binolari yangilandi.' }
		} catch (error) {
			console.error(error)
			throw new Error('Error on deleting company by id')
		}
	}

	// ========== Alert mqtt message sender to Company office gateway ========= //
	async wakeUpOfficeGateway(gatewayNumber) {
		// Step 1: Serial number orqali gateway topish (har qanday turdagi)
		const gateway = await this.gatewaySchema.findOne({
			serial_number: gatewayNumber,
		})

		if (!gateway || !gateway.building_id) {
			throw new Error('Not found gateway or building_id')
		}
		// Step 2: gateway.building_id orqali building ichidagi OFFICE_GATEWAY larni topish
		const buildingOfficeGateways = await this.buildingSchema.aggregate([
			{
				$match: {
					_id: gateway.building_id, // Getting building we need
				},
			},
			{
				$lookup: {
					from: 'gateways',
					localField: 'gateway_sets', // Bu building ichidagi array (ObjectId lar)
					foreignField: '_id', // Bu gateways koleksiyasidagi _id
					as: 'gateway_docs', // Natijani bu nom bilan array qilib qo‘yadi
				},
			},
			{
				$project: {
					building_name: 1,
					office_gateways: {
						$filter: {
							input: '$gateway_docs',
							as: 'gw',
							cond: { $eq: ['$$gw.gateway_type', 'OFFICE_GATEWAY'] },
						},
					},
				},
			},
		])

		const officeGateways = buildingOfficeGateways[0]?.office_gateways || []

		if (officeGateways.length === 0) {
			throw new Error('No OFFICE_GATEWAY found for this building')
		}

		const publishData = {
			cmd: 3,
			gateway_type: 'OFFICE_GATEWAY',
			task: 'wake_up',
		}

		for (const gw of officeGateways) {
			const serialNum = gw.serial_number
			console.log(officeGateways)
			const topic = `GSSIOT/01030369081/GATE_WAKE_UP/GRM22JU22P${serialNum}`
			console.log('Topic: ', topic)

			// 1. Publish qilish
			if (!mqttClient.connected) {
				throw new Error('MQTT client is not connected')
			}

			await new Promise((resolve, reject) => {
				mqttClient.publish(topic, JSON.stringify(publishData), err => {
					if (err) {
						reject(new Error(`MQTT publishing failed for topic: ${topic}`))
					} else {
						resolve(true)
					}
				})
			})

			// 2. Javobni kutish
			await new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new Error('MQTT response timeout'))
				}, 10000) // 10s timeout

				mqttEmitter.once('gwPubRes', data => {
					clearTimeout(timer)
					if (data?.resp === 'success') {
						resolve(true)
					} else {
						reject(new Error('Failed publishing gateway to mqtt'))
					}
				})
			})
		}

		return 'All OFFICE_GATEWAY type gateways waked up!'
	}

	// ==========================================================================================================
	//                              CLIENT-Boss type user related functons                                     //
	// ==========================================================================================================

	async getBossClientsData(clientId) {
		try {
			const clients = await this.clientSchema.find({ boss_users: clientId })
			return clients
		} catch (error) {
			throw new Error('Error on fetching company by id')
		}
	}

	async getBossBuildingsData(clientId) {
		try {
			const client = await this.clientSchema.findOne({ boss_users: clientId })

			const buildings = await this.buildingSchema
				.find({
					client_id: clientId,
				})
				.sort({ building_num: 1 })
			return { client, buildings }
		} catch (error) {
			throw new Error('Error on fetching company by id')
		}
	}
}

module.exports = CompanyService
