const ProductService = require('../services/product.service')
const path = require('path')
const fs = require('fs')
const fileService = require('../services/file.service')

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
productController.downloadNodeHistory = async (req, res) => {
	try {
		console.log('request: downloadNodeHistory')
		const { buildingId } = req.query
		const productService = new ProductService()
		const buffer = await productService.downloadNodeHistoryData(buildingId)
		res.setHeader(
			'Content-Disposition',
			'attachment; filename="building-nodes-history.xlsx"'
		)
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		)
		res.status(200).send(buffer)
	} catch (error) {
		console.error('Error generating Excel:', error)
		res.json({ state: 'fail', message: error.message })
	}
}

// =============================== Product changing logic ================================== //

productController.updateProductStatus = async (req, res) => {
	try {
		console.log('POST: reActivateNode')
		const { product_type, product_id } = req.body
		const productService = new ProductService()

		if (product_type === 'NODE') {
			const result = await productService.updateNodeStatusData(product_id)
			return res.json({
				state: 'success',
				updated_node: result,
			})
		} else if (product_type === 'GATEWAY') {
			const result = await productService.updateGatewayStatusData(product_id)
			return res.json({
				state: 'success',
				updated_gateway: result,
			})
		}

		// Agar hech qaysi shart bajarilmasa, "fail" javobi qaytariladi.
		return res.json({
			state: 'fail',
			message: 'undefined product type.',
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.deleteProduct = async (req, res) => {
	try {
		console.log('POST: deleteProduct')
		const { product_type, product_id } = req.body
		const productService = new ProductService()

		if (product_type === 'NODE') {
			const result = await productService.deleteNodeData(product_id)
			return res.json({
				state: 'success',
				deleted: result,
			})
		} else if (product_type === 'GATEWAY') {
			const result = await productService.deleteGatewayData(product_id)
			return res.json({
				state: 'Success',
				deleted: result,
			})
		}

		return res.json({
			state: 'fail',
			message: 'undefined product type.',
		})
	} catch (error) {
		console.log('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.setNodesPosition = async (req, res) => {
	try {
		console.log('POST: setNodesPosition')
		const data = req.body

		// Ma'lumotlarni tekshirish
		// for (const item of data) {
		// 	if (!item.nodeNum || !item.position) {
		// 		return res.json({
		// 			error: 'Fail',
		// 			message:
		// 				'No matching .xlsx, .xls file or data, please upload true file and data',
		// 		})
		// 	}
		// }

		const nodeService = new ProductService()
		const result = await nodeService.setNodesPositionData(data)

		// Agar xizmat xatosi bo'lsa
		if (result.state === 'fail') {
			return res.json(result)
		}

		// Muvaffaqiyatli javob
		res.json({ state: 'success', message: result.message })
	} catch (error) {
		console.log('Error on setNodesPosition', error.message)
		res.status(500).json({ state: 'fail', error: error.message })
	}
}

productController.uploadXlsFile = async (req, res) => {
	try {
		console.log('request: uploadXlsFile')
		const { buildingId, nodesPosition } = req.body
		if (!req.files || !req.files.file) {
			return res.status(400).json({ error: 'Fayl tanlanmagan' })
		}

		// Ma'lumotlarni tekshirish
		const nodesPositionArrParsed = JSON.parse(nodesPosition)
		for (const item of nodesPositionArrParsed) {
			if (!item.nodeNum || !item.position) {
				return res.json({
					error: 'Fail',
					message:
						'No matching data structure, please check uploading file data structure!',
				})
			}
		}

		// file ni req dan olamiz
		const file = Array.isArray(req.files.file)
			? req.files.file[0]
			: req.files.file

		const nodeService = new ProductService()
		const result = await nodeService.setNodesPositionData(
			nodesPositionArrParsed,
			buildingId,
			file
		)

		if (result.state == 'fail') {
			return res.json(result)
		}

		res.json({ state: 'success', message: result.message })
	} catch (error) {
		console.error(error)
		res.json({ error: 'Serverda xatolik yuz berdi', error: error })
	}
}
