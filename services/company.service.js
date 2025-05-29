const ClientSchema = require('../schema/Company.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')
const NodeSchema = require('../schema/Node.model')

class CompanyService {
	constructor() {
		this.clientSchema = ClientSchema
		this.gatewaySchema = GatewaySchema
		this.buildingSchema = BuildingSchema
		this.nodeSchema = NodeSchema
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
