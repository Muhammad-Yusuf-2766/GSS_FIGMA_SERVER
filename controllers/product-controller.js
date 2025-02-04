const ProductService = require('../services/product.service')

let productController = module.exports

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

// ==================================================================== //
productController.getComany = async (req, res) => {
	try {
		console.log('request: getCompany', req.params)
		const { id } = req.params,
			comapnyService = new CompanyService(),
			result = await comapnyService.getCompanyData(id)
		res.json({ data: result })
	} catch (error) {
		console.log('Error', error)
		res.json({ state: 'Fail', message: error.message })
	}
}
