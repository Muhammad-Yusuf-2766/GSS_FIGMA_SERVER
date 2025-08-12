const CompanyService = require('../services/company.service')
const { logger, logError } = require('../lib/logger')

let companyController = module.exports

companyController.createBuilding = async (req, res) => {
	try {
		logger('request: createBuilding')
		const data = req.body
		const companyService = new CompanyService()
		const result = await companyService.createBuildingData(data)
		res.json({
			state: 'succcess',
			building: result,
			message: '빌딩이 생성돼었읍니다',
		})
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.getActiveBuildings = async (req, res) => {
	try {
		logger('request: getActiveBuildings')
		const companyService = new CompanyService()
		const buildings = await companyService.getActiveBuildingsData()
		res.json({ state: 'succcess', buildings: buildings })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.getBuildings = async (req, res) => {
	try {
		logger('request: getBuildings')
		const companyService = new CompanyService()
		const buildings = await companyService.getBuildingsData()
		res.json({ state: 'succcess', buildings: buildings })
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.createClient = async (req, res) => {
	try {
		logger('request: createClient')
		const data = req.body
		const companyService = new CompanyService()
		const client = await companyService.createClientData(data)
		res.json({
			state: 'succcess',
			client: client,
			message: '클라이언트가 생성돼었읍니다',
		})
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.getComanies = async (req, res) => {
	try {
		logger('request: getCompanies')
		const comapnyService = new CompanyService()
		const clients = await comapnyService.getCompanies()
		res.json({
			state: 'succcess',
			clients: clients,
		})
	} catch (error) {
		logger('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getClient = async (req, res) => {
	try {
		logger('request: getCompany-buildings')
		const { id } = req.params,
			comapnyService = new CompanyService(),
			result = await comapnyService.getCompanyData(id)
		res.json({
			state: 'success',
			client: result.client,
			client_buildings: result.buildings,
		})
	} catch (error) {
		logger('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getBuildingNodes = async (req, res) => {
	try {
		logger('request: getBuildingNodes')

		const { id } = req.params
		const companyService = new CompanyService()

		const result = await companyService.getBuildingNodesData(id)

		if (!result || !result.building || !result.nodes) {
			throw new Error('No building or nodes found')
		}

		res.json({
			state: 'success',
			building: result.building,
			nodes: result.nodes,
		})
	} catch (error) {
		console.error('Error in getBuildingNodes:', error.message)
		res.status(400).json({ state: 'fail', message: error.message })
	}
}

companyController.getBuildingAngleNodes = async (req, res) => {
	try {
		logger('request: getBuildingAngleNodes')

		const { id } = req.params
		const companyService = new CompanyService()

		const result = await companyService.getBuildingAngleNodesData(id)

		if (!result || !result.building || !result.angleNodes) {
			throw new Error('No building or nodes found')
		}

		res.json({
			state: 'success',
			building: result.building,
			angle_nodes: result.angleNodes,
		})
	} catch (error) {
		console.error('Error on getBuildingAngleNodes:', error.message)
		res.status(400).json({ state: 'fail', message: error.message })
	}
}

companyController.getAngleNodeSummary = async (req, res) => {
	try {
		logger('request: getAngleNodeSummary')

		const { id } = req.params
		const companyService = new CompanyService()

		const result = await companyService.getAngleNodesSummaryData(id)

		// if (!result || !result.building || !result.angleNodes) {
		// 	throw new Error('No building or nodes found')
		// }

		res.json({
			state: 'success',
			result,
		})
	} catch (error) {
		console.error('Error on getBuildingAngleNodes:', error.message)
		res.status(400).json({ state: 'fail', message: error.message })
	}
}

companyController.deleteCompany = async (req, res) => {
	try {
		logger('request: deleteCompany')
		const { clientId } = req.params
		const companyService = new CompanyService(),
			result = await companyService.deleteCompanyData(clientId)

		res.json({
			state: 'success',
			client: clientId,
			message: result.message,
		})
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.deleteBuilding = async (req, res) => {
	try {
		logger('request: deleteBuilding')
		const { buildingId } = req.params
		const companyService = new CompanyService(),
			result = await companyService.deleteBuildingData(buildingId)

		res.json({
			state: 'success',
			building: buildingId,
			message: result.message,
		})
	} catch (error) {
		logError(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.wakeUpOfficeGateway = async (req, res) => {
	try {
		const companyService = new CompanyService()
		const { gateway_number } = req.body
		const result = await companyService.wakeUpOfficeGateway(gateway_number)
		res.json(result)
	} catch (error) {
		logError(error)
		res.json({ state: 'fail', message: error.message })
	}
}

// ==========================================================================================================
//                              CLIENT-Boss type user related functons                                     //
// ==========================================================================================================

companyController.getBossClients = async (req, res) => {
	try {
		logger('request: getClientBoss')
		const { userId } = req.body
		const comapnyService = new CompanyService()
		const clients = await comapnyService.getBossClientsData(userId)
		res.json({
			state: 'success',
			clients: clients,
		})
	} catch (error) {
		logger('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getBossBuildings = async (req, res) => {
	try {
		logger('request: getBossBuildings')
		const { clientId } = req.body,
			comapnyService = new CompanyService(),
			result = await comapnyService.getBossBuildingsData(clientId)
		res.json({
			state: 'success',
			clients: result.client,
			client_buildings: result.buildings,
		})
	} catch (error) {
		logger('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}
