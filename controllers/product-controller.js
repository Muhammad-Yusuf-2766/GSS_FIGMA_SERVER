const ProductService = require('../services/product.service')

let productController = module.exports

// =============================== Product creating & geting logics ================================== //

productController.createNodes = async (req, res) => {
	try {
		console.log('request: createNode')
		const nodes = req.body

		// Ma'lumot turi array ekanligini tekshiring
		if (!Array.isArray(nodes)) {
			return res.status(400).json({
				state: 'Failed',
				message: 'Invalid data format. Expected an array.',
			})
		}

		const productService = new ProductService()

		const createdNodes = await productService.createNodesData(nodes)
		res.json({
			state: 'succcess',
			message: `${createdNodes.length} nodes created successfully!`,
			nodes: createdNodes,
		})
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.createGateway = async (req, res) => {
	try {
		console.log('request: createGateway:', req.body)
		const data = req.body
		const productService = new ProductService()
		await productService.createGatewayData(data)
		res.json({ state: 'succcess', message: '게이트웨이가 생성돼었읍니다' })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.getGateways = async (req, res) => {
	try {
		console.log('request: getGateways')
		const productService = new ProductService()
		const gateways = await productService.getGatewaysData()
		res.json({ state: 'succcess', gateways: gateways })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

productController.getActiveGateways = async (req, res) => {
	try {
		console.log('request: getActiveGatewaysData')
		const productService = new ProductService()
		const gateways = await productService.getActiveGatewaysData()
		res.json({ state: 'succcess', gateways: gateways })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

productController.getNodes = async (req, res) => {
	try {
		console.log('request: getNodes')
		const productService = new ProductService()
		const nodes = await productService.getNodesData()
		res.json({ state: 'succcess', nodes: nodes })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

productController.getActiveNodes = async (req, res) => {
	try {
		console.log('request: getNodes')
		const productService = new ProductService()
		const nodes = await productService.getActiveNodesData()
		res.json({ state: 'succcess', nodes: nodes })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

// =============================== Product changing logic ================================== //

productController.updateNodeStatus = async (req, res) => {
	try {
		console.log('POST: reActivateNode')
		const { id } = req.params
		const productService = new ProductService()
		const result = await productService.updateNodeStatusData(id)
		res.json({
			state: 'success',
			updated_node: result,
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.deleteNode = async (req, res) => {
	try {
		console.log('POST: deleteNode')
		const { id } = req.params
		const productService = new ProductService()
		const result = await productService.deleteNodeData(id)
		res.json({
			state: 'success',
			updated_node: result,
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.updateGatewayStatus = async (req, res) => {
	try {
		console.log('POST: reActivateNode')
		const { id } = req.params
		const productService = new ProductService()
		const result = await productService.updateGatewayStatusData(id)
		res.json({
			state: 'success',
			updated_gateway: result,
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.deleteGateway = async (req, res) => {
	try {
		console.log('POST: deleteGateway')
		const { id } = req.params
		const productService = new ProductService()
		const result = await productService.deleteGatewayData(id)
		res.json({
			state: 'Success',
			deleted: result,
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}
