const express = require('express')
const product_router = express.Router()
const productController = require('../controllers/product-controller')

// product_router.post('/create-nodes', productController.createNode)
product_router.post('/create-nodes', productController.createNodes)
product_router.post('/create-gateway', productController.createGateway)
product_router.get('/get-gateways', productController.getGateways)
product_router.get('/get-active-gateways', productController.getActiveGateways)
product_router.get('/get-nodes', productController.getNodes)
product_router.get('/get-active-nodes', productController.getActiveNodes)

module.exports = product_router
