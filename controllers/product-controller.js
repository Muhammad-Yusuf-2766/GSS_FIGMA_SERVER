const ProductService = require('../services/product.service')
const path = require('path')
const fs = require('fs')
const AngleNodeHistory = require('../schema/Angle.node.history.model')
const { logger, logError } = require('../lib/logger')

let productController = module.exports

// =============================== Product creating & geting logics ================================== //

productController.createNodes = async (req, res) => {
	try {
		logger('request: createNode')
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
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.createGateway = async (req, res) => {
	try {
		logger('request: createGateway:')
		const data = req.body
		const productService = new ProductService()
		await productService.createGatewayData(data)
		res.json({ state: 'succcess', message: '게이트웨이가 생성돼었읍니다' })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.makeWakeUpOfficeGateway = async (req, res) => {
	try {
		logger('request: makeWakeUpOfficeGateway:')
		const gwNumber = req.query.gw_number
		const alarmActive = req.query.alarmActive === 'true' // "true" bo‘lsa true, aks holda false
		const alertLevel = Number(req.query.alertLevel)
		const productService = new ProductService()
		const result = await productService.makeWakeUpOfficeGateway(
			gwNumber,
			alarmActive,
			alertLevel
		)
		res.json({ state: 'succcess', message: `request sent to ${result}` })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.createOfficeGateway = async (req, res) => {
	try {
		logger('request: createOfficeGateway:')
		const data = req.body
		const productService = new ProductService()
		if (!data.serial_number) {
			return res
				.status(404)
				.json({ state: 'fail', message: 'Please serial number is required' })
		}
		await productService.createOfficeGatewayData(data)
		res.json({ state: 'succcess', message: '게이트웨이가 생성돼었읍니다' })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.createAngleNodes = async (req, res) => {
	try {
		logger('request: createAngleNodes')
		const angleNodes = req.body

		// Ma'lumot turi array ekanligini tekshiring
		if (!Array.isArray(angleNodes)) {
			return res.status(400).json({
				state: 'fail',
				message: 'Invalid data format. Expected an array.',
			})
		}

		const productService = new ProductService()

		const createdNodes = await productService.createAngleNodesData(angleNodes)
		res.json({
			state: 'succcess',
			message: `${createdNodes.length} angle nodes created successfully!`,
		})
	} catch (error) {
		logError(error.message)
		res.status(400).json({ state: 'fail', message: error.message })
	}
}

productController.getGateways = async (req, res) => {
	try {
		logger('request: getGateways')
		const productService = new ProductService()
		const gateways = await productService.getGatewaysData()
		res.json({ state: 'succcess', gateways: gateways })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

productController.getActiveGateways = async (req, res) => {
	try {
		logger('request: getActiveGatewaysData')
		const productService = new ProductService()
		const gateways = await productService.getActiveGatewaysData()
		res.json({ state: 'succcess', gateways: gateways })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.getSingleGateway = async (req, res) => {
	try {
		logger('request: getSingleGateway')
		const { number } = req.params

		const productService = new ProductService()
		const gateway = await productService.getSingleGatewayData(number)

		if (!gateway) {
			return res.status(404).json({
				state: 'Fail',
				message: '게이트웨이가 없읍니다,다른거 확인해보세요!',
			})
		}

		res.status(200).json({
			state: 'success',
			gateway,
		})
	} catch (error) {
		console.error('Xatolik:', error.message)
		res.status(500).json({
			state: 'fail',
			message: 'Internal Server error',
			detail: error.message,
		})
	}
}

productController.getNodes = async (req, res) => {
	try {
		logger('request: getNodes')
		const productService = new ProductService()
		const nodes = await productService.getNodesData()
		res.json({ state: 'succcess', nodes: nodes })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

productController.getActiveNodes = async (req, res) => {
	try {
		logger('request: getNodes')
		const productService = new ProductService()
		const nodes = await productService.getActiveNodesData()
		res.json({ state: 'succcess', nodes: nodes })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

productController.getActiveAngleNodes = async (req, res) => {
	try {
		logger('request: getActiveAngleNodes')
		const productService = new ProductService()
		const angleNodes = await productService.getActiveAngleNodesData()

		if (!angleNodes) {
			return res.status(404).json({
				state: 'fail',
				message: '동작 가능한 비계전도 노드가 없습니다.',
			})
		}

		res.status(200).json({
			state: 'success',
			angle_nodes: angleNodes,
		})
	} catch (error) {
		console.error('Error:', error.message)
		res.status(500).json({
			state: 'fail',
			message: 'Internal Server error',
			detail: error.message,
		})
	}
}

productController.downloadNodeHistory = async (req, res) => {
	try {
		logger('request: downloadNodeHistory')
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

productController.combineAngleNodeToGateway = async (req, res) => {
	try {
		logger('request: combineAngleNodeToGateway:')
		const data = req.body
		const productService = new ProductService()
		await productService.combineAngleNodeToGatewayData(data)
		res.json({
			state: 'succcess',
			message: '비계전도 노드가 게이트웨이에 속했습니다다',
		})
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

// =============================== Product changing logic ================================== //

productController.updateProductStatus = async (req, res) => {
	try {
		logger('POST: reActivateNode')
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
		logger('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.deleteProduct = async (req, res) => {
	try {
		logger('POST: deleteProduct')
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
		logger('ERROR: update all nodes', error)
		res.status(500).json({ state: 'Fail', message: error.message })
	}
}

productController.setNodesPosition = async (req, res) => {
	try {
		logger('POST: setNodesPosition')
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
		logger('Error on setNodesPosition', error.message)
		res.status(500).json({ state: 'fail', error: error.message })
	}
}

productController.uploadXlsFile = async (req, res) => {
	try {
		logger('request: uploadXlsFile')
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

// ========================== Angle-Node-Graphic routes ================================== //
productController.angleNodeGraphicData = async (req, res) => {
	logger('request: angleNodeGraphicData')

	try {
		const { doorNum, from, to } = req.query

		if (!doorNum || !from || !to) {
			return res.status(400).json({ message: 'doorNum, from, to required' })
		}

		const data = await AngleNodeHistory.find({
			doorNum: parseInt(doorNum),
			createdAt: {
				$gte: new Date(from),
				$lte: new Date(to),
			},
		}).sort({ createdAt: 1 })

		res.json(data)
	} catch (err) {
		console.error('Error fetching data:', err)
		res.status(500).json({ message: 'Server error' })
	}
}
