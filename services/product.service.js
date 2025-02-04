const NodeSchema = require('../schema/Node.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')

class ProductService {
	constructor() {
		this.nodeSchema = NodeSchema
		this.gatewaySchema = GatewaySchema
		this.buildingSchema = BuildingSchema
	}

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
			const existGateway = await this.gatewaySchema.findOne({
				serial_number: data.serial_number,
			})

			if (existGateway) {
				throw new Error(
					`일련 번호가 ${existGateway.serial_number}인 기존 게이트웨이가 있습니다. `
				)
			}

			const gateway = new this.gatewaySchema(data)

			const nodesId = data.nodes
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
				throw new Error('There is no any active-nodes in database :(')
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
}

module.exports = ProductService
