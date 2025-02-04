const express = require('express')
const company_router = express.Router()
const companyController = require('../controllers/company-controller')

company_router.post('/create-building', companyController.createBuilding)
company_router.post('/create-client', companyController.createClient)

company_router.get('/clients', companyController.getComanies)
company_router.get(
	'/get-active-buildings',
	companyController.getActiveBuildings
)
company_router.get('/clients/:id', companyController.getClient)
company_router.get('/buildings/:id', companyController.getBuildingNodes)

module.exports = company_router
