const express = require('express')
const product_router = express.Router()
const productController = require('../controllers/product-controller')

// =============================== Product creating & geting endpoints ================================== //

product_router.post('/create-nodes', productController.createNodes)
product_router.post('/create-gateway', productController.createGateway)
product_router.post(
	'/create-office-gateway',
	productController.createOfficeGateway
)
product_router.get(
	'/wake-up-gateway',
	productController.makeWakeUpOfficeGateway
)
product_router.post('/create-angle-nodes', productController.createAngleNodes)
product_router.get('/get-gateways', productController.getGateways)
product_router.get('/get-active-gateways', productController.getActiveGateways)
product_router.get(
	'/get-single-gateway/:number',
	productController.getSingleGateway
)
product_router.get('/get-nodes', productController.getNodes)
product_router.get('/get-active-nodes', productController.getActiveNodes)
product_router.get(
	'/get-active-angle-nodes',
	productController.getActiveAngleNodes
)
product_router.get(
	'/download-nodes-history',
	productController.downloadNodeHistory
)

// =============================== Product changing endpoints ================================== //
product_router.post('/update-product', productController.updateProductStatus)
product_router.post('/delete-product', productController.deleteProduct)
product_router.post('/set-node-position', productController.uploadXlsFile)
product_router.post(
	'/combine-angle-nodes',
	productController.combineAngleNodeToGateway
)

// ========================== Angle-Node-Graphic routes ================================== //
product_router.get('/angle-node/data', productController.angleNodeGraphicData)

module.exports = product_router
