const express = require('express')
const product_router = express.Router()
const productController = require('../controllers/product-controller')

// =============================== Product creating & geting endpoints ================================== //

product_router.post('/create-nodes', productController.createNodes)
product_router.post('/create-gateway', productController.createGateway)
product_router.get('/get-gateways', productController.getGateways)
product_router.get('/get-active-gateways', productController.getActiveGateways)
product_router.get('/get-nodes', productController.getNodes)
product_router.get('/get-active-nodes', productController.getActiveNodes)

// =============================== Product changing endpoints ================================== //
product_router.get(
	'/update-node-status/:id',
	productController.updateNodeStatus
)
product_router.get('/delete-node-/:id', productController.deleteNode)
product_router.get(
	'/update-gateway-status/:id',
	productController.updateGatewayStatus
)
product_router.get('/delete-gateway-/:id', productController.deleteGateway)

module.exports = product_router
