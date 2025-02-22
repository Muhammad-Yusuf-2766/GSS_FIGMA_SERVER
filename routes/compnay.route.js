const express = require('express')
const company_router = express.Router()
const companyController = require('../controllers/company-controller')

// ========== Building related endpoints ======= //
company_router.post('/create-building', companyController.createBuilding)
company_router.get(
	'/get-active-buildings',
	companyController.getActiveBuildings
)
company_router.get('/buildings/:id', companyController.getBuildingNodes)
company_router.delete(
	'/delete/building/:buildingId',
	companyController.deleteBuilding
)

// ========== Client related endpoints ======= //
company_router.post('/create-client', companyController.createClient)
company_router.get('/clients', companyController.getComanies)
company_router.get('/clients/:id', companyController.getClient)
company_router.delete(
	'/delete/client/:clientId',
	companyController.deleteCompany
)

//  =========================  Boss Client user related endpoints ================ //
company_router.post('/boss-clients', companyController.getBossClients)

module.exports = company_router
