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
product_router.post('/update-product', productController.updateProductStatus)
product_router.post('/delete-product', productController.deleteProduct)
product_router.post('/set-node-position', productController.uploadXlsFile)

module.exports = product_router
