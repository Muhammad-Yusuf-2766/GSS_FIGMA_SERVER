const CompanyService = require('../services/company.service')

let companyController = module.exports

companyController.createBuilding = async (req, res) => {
	try {
		console.log('request: createBuilding')
		const data = req.body
		const companyService = new CompanyService()
		const result = await companyService.createBuildingData(data)
		res.json({
			state: 'succcess',
			building: result,
			message: '빌딩이 생성돼었읍니다',
		})
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.getActiveBuildings = async (req, res) => {
	try {
		console.log('request: getActiveBuildings')
		const companyService = new CompanyService()
		const buildings = await companyService.getActiveBuildingsData()
		res.json({ state: 'succcess', buildings: buildings })
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.createClient = async (req, res) => {
	try {
		console.log('request: createClient')
		const data = req.body
		const companyService = new CompanyService()
		const client = await companyService.createClientData(data)
		res.json({
			state: 'succcess',
			client: client,
			message: '클라이언트가 생성돼었읍니다',
		})
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.getComanies = async (req, res) => {
	try {
		console.log('request: getCompanies')
		const comapnyService = new CompanyService()
		const clients = await comapnyService.getCompanies()
		res.json({
			state: 'succcess',
			clients: clients,
		})
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getClient = async (req, res) => {
	try {
		console.log('request: getCompany-buildings')
		const { id } = req.params,
			comapnyService = new CompanyService(),
			result = await comapnyService.getCompanyData(id)
		res.json({
			state: 'success',
			client: result.client,
			client_buildings: result.buildings,
		})
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getBuildingNodes = async (req, res) => {
	try {
		console.log('request: getBuildingNodes')

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

companyController.deleteCompany = async (req, res) => {
	try {
		console.log('request: deleteCompany')
		const { clientId } = req.params
		const companyService = new CompanyService(),
			result = await companyService.deleteCompanyData(clientId)

		res.json({
			state: 'success',
			client: clientId,
			message: result.message,
		})
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

companyController.deleteBuilding = async (req, res) => {
	try {
		console.log('request: deleteBuilding')
		const { buildingId } = req.params
		const companyService = new CompanyService(),
			result = await companyService.deleteBuildingData(buildingId)

		res.json({
			state: 'success',
			building: buildingId,
			message: result.message,
		})
	} catch (error) {
		console.log(error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

// ==========================================================================================================
//                              CLIENT-Boss type user related functons                                     //
// ==========================================================================================================

companyController.getBossClients = async (req, res) => {
	try {
		console.log('request: getClientBoss')
		const { userId } = req.body
		const comapnyService = new CompanyService()
		const clients = await comapnyService.getBossClientsData(userId)
		res.json({
			state: 'success',
			clients: clients,
		})
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getBossBuildings = async (req, res) => {
	try {
		console.log('request: getBossBuildings')
		const { clientId } = req.body,
			comapnyService = new CompanyService(),
			result = await comapnyService.getBossBuildingsData(clientId)
		res.json({
			state: 'success',
			clients: result.client,
			client_buildings: result.buildings,
		})
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}
