const CompanySchema = require('../schema/Company.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')
const NodeSchema = require('../schema/Node.model')

class CompanyService {
	constructor() {
		this.companySchema = CompanySchema
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

	async createClientData(data) {
		try {
			// Transactionni boshlash
			const session = await this.companySchema.startSession()
			session.startTransaction()

			try {
				// Step 1: Client saving
				const company = new this.companySchema(data)
				const result = await company.save({ session })

				// Step 2: Update `building_status` va `company_id`
				const updateResult = await this.buildingSchema.updateMany(
					{ _id: { $in: data.client_buildings } }, // 🛠 TO'G'RI FIELD NOMI!
					{ $set: { building_status: false, company_id: company._id } },
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
			const result = await this.companySchema.find()

			return result
		} catch (error) {
			throw new Error('Error on fetching companies')
		}
	}

	async getCompanyData(id) {
		try {
			const buildings = await this.buildingSchema.find({ company_id: id })
			return buildings
		} catch (error) {
			throw new Error('Error on fetching company by id')
		}
	}

	async getBuildingNodesData(buildingId) {
		try {
			const gateways = await this.gatewaySchema.find({
				building_id: buildingId,
			})

			if (!gateways.length) {
				return [] // Agar gateway yo'q bo'lsa, bo'sh massiv qaytarish
			}

			const gatewayIds = gateways.map(gateway => gateway._id)

			const nodes = await this.nodeSchema.find({
				gateway_id: { $in: gatewayIds },
			})

			return nodes
		} catch (error) {
			throw new Error('Error on fetching company by id')
		}
	}
}

module.exports = CompanyService
