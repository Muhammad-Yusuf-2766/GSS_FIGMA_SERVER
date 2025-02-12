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
		res.json({ state: 'Fail', message: error.message })
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
		res.json({ state: 'Fail', message: error.message })
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
			buildings = await comapnyService.getCompanyData(id)
		res.json({ state: 'success', client_buildings: buildings })
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}

companyController.getBuildingNodes = async (req, res) => {
	try {
		const { id } = req.params,
			comapnyService = new CompanyService(),
			nodes = await comapnyService.getBuildingNodesData(id)
		res.json({ state: 'success', nodes: nodes })
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'Fail', message: error.message })
	}
}
