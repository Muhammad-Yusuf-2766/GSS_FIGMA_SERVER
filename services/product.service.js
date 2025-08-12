const NodeSchema = require('../schema/Node.model')
const NodeHistorySchema = require('../schema/History.model')
const GatewaySchema = require('../schema/Gateway.model')
const BuildingSchema = require('../schema/Building.model')
const { mqttClient, mqttEmitter } = require('./Mqtt.service')
const fileService = require('./file.service')
const AngleNodeSchema = require('../schema/Angle.node.model')

class ProductService {
	constructor() {
		this.nodeSchema = NodeSchema
		this.gatewaySchema = GatewaySchema
		this.buildingSchema = BuildingSchema
		this.nodeHistorySchema = NodeHistorySchema
		this.angleNodeSchema = AngleNodeSchema
	}

	// =============================== Product creating & geting logics ================================== //

	async createNodesData(arrayData) {
		try {
			const existNodes = await this.nodeSchema.find({
				doorNum: { $in: arrayData.map(data => data.doorNum) },
			})
			if (existNodes.length > 0) {
				const existNodeNums = existNodes.map(node => node.doorNum)
				throw new Error(
					`노드 번호가 ${existNodeNums.join(',')}인 기존 노드가 있습니다 !`
				)
			}

			const result = await this.nodeSchema.insertMany(arrayData)
			return result
		} catch (error) {
			throw new Error(`Error: ${error.message}`)
		}
	}

	async createAngleNodesData(arrayData) {
		try {
			const existNodes = await this.angleNodeSchema.find({
				doorNum: { $in: arrayData.map(obj => obj.doorNum) },
			})
			if (existNodes.length > 0) {
				const existNodeNums = existNodes.map(node => node.doorNum)
				throw new Error(
					`노드 번호가 ${existNodeNums.join(',')}인 기존 노드가 있습니다 !`
				)
			}
			const arrayObject = arrayData.map(({ doorNum }) => ({
				doorNum,
			}))

			const result = await this.angleNodeSchema.insertMany(arrayObject)
			return result
		} catch (error) {
			throw new Error(`Error: ${error.message}`)
		}
	}

	async createOfficeGatewayData(data) {
		try {
			const existGateway = await this.gatewaySchema.findOne({
				serial_number: data.serial_number,
			})

			if (existGateway) {
				throw new Error(
					`노드 번호가 ${existGateway.serial_number} 인 기존 게이트웨이가 있습니다, 다른 넘버를 입력히세요.`
				)
			}

			const result = await this.gatewaySchema.create(data)
			return result
		} catch (error) {
			throw new Error(`${error.message}`)
		}
	}

	async createGatewayData(data) {
		try {
			// exsting gateway checkng logic
			const existGateway = await this.gatewaySchema.findOne({
				serial_number: data.serial_number,
			})
			if (existGateway) {
				throw new Error(
					`일련 번호가 ${existGateway.serial_number}인 기존 게이트웨이가 있습니다. `
				)
			}
			const gateway = new this.gatewaySchema(data)

			// gateway Mqtt publish logic
			const gw_number = data.serial_number
			const nodesId = data.nodes
			const nodes = await this.nodeSchema.find(
				{ _id: { $in: nodesId } },
				{ doorNum: 1, _id: 0 }
			)

			let topic = `GSSIOT/01030369081/GATE_SUB/GRM22JU22P${gw_number}`

			const publishData = {
				cmd: 2,
				nodeType: 0,
				numNodes: nodes.length,
				nodes: nodes.map(node => node.doorNum),
			}
			// console.log('Publish-data:', publishData, topic)

			// 3. MQTT serverga muvaffaqiyatli yuborilishini tekshirish
			if (mqttClient.connected) {
				const publishPromise = new Promise((resolve, reject) => {
					mqttClient.publish(topic, JSON.stringify(publishData), err => {
						if (err) {
							reject(new Error(`MQTT publishing failed for topic: ${topic}`))
						} else {
							resolve(true)
						}
					})
				})
				// Publish'ning natijasini kutamiz
				await publishPromise

				const mqttResponsePromise = new Promise((resolve, reject) => {
					mqttEmitter.once('gwPubRes', data => {
						if (data.resp === 'success') {
							resolve(true)
						} else {
							reject(new Error('Failed publishing gateway to mqtt'))
						}
					})

					// Javob kutilayotgan vaqtda taymer qo'shing
					setTimeout(() => {
						reject(new Error('MQTT response timeout'))
					}, 10000) // Masalan, 5 soniya kutish
				})

				await mqttResponsePromise
			} else {
				throw new Error('MQTT client is not connected')
			}

			await this.nodeSchema.updateMany(
				{ _id: { $in: nodesId } },
				{ $set: { node_status: false, gateway_id: gateway._id } }
			)
			const result = await gateway.save()
			return result
		} catch (error) {
			throw new Error(`Error on creating-gateway: ${error.message}`)
		}
	}

	async makeWakeUpOfficeGateway(gw_number, alarmActive, alertLevel) {
		try {
			// gateway Mqtt publish logic
			// const gw_number = '0102'

			let topic = `GSSIOT/01030369081/GATE_SUB/GRM22JU22P${gw_number}`

			const publishData = {
				cmd: 3,
				alarmActive,
				alertLevel: alertLevel,
			}
			console.log('Publish-data:', publishData)

			// 3. MQTT serverga muvaffaqiyatli yuborilishini tekshirish
			if (mqttClient.connected) {
				console.log(topic)

				mqttClient.publish(topic.toString(), JSON.stringify(publishData))
			} else {
				throw new Error('MQTT client is not connected')
			}

			return topic
		} catch (error) {
			throw new Error(`Error on creating-gateway: ${error.message}`)
		}
	}

	async combineAngleNodeToGatewayData(data) {
		try {
			// exsting gateway checkng logic
			const existGateway = await this.gatewaySchema.findOne({
				_id: data.gateway_id,
			})
			if (!existGateway) {
				throw new Error(
					`일련 번호가 ${existGateway.serial_number}인 게이트웨이가 없습니다. 먼저 게이트웨이를 생성하세요`
				)
			}

			// gateway Mqtt publish logic
			const gw_number = data.serial_number
			const nodesId = data.angle_nodes
			const nodes = await this.angleNodeSchema.find(
				{ _id: { $in: nodesId } },
				{ doorNum: 1, _id: 1 }
			)

			let topic = `GSSIOT/01030369081/GATE_SUB/GRM22JU22P${gw_number}`

			const publishData = {
				cmd: 2,
				nodeType: 1,
				numNodes: nodes.length,
				nodes: nodes.map(node => node.doorNum),
			}
			console.log('Publish-data:', publishData, topic)

			// 3. MQTT serverga muvaffaqiyatli yuborilishini tekshirish
			if (mqttClient.connected) {
				const publishPromise = new Promise((resolve, reject) => {
					mqttClient.publish(topic, JSON.stringify(publishData), err => {
						if (err) {
							reject(
								new Error(
									`MQTT publishing failed for Angle-node topic: ${topic}`
								)
							)
						} else {
							resolve(true)
						}
					})
				})
				// Publish'ning natijasini kutamiz
				await publishPromise

				const mqttResponsePromise = new Promise((resolve, reject) => {
					mqttEmitter.once('gwPubRes', data => {
						if (data.resp === 'success') {
							resolve(true)
						} else {
							reject(
								new Error('Failed publishing for Angle-node gateway to mqtt')
							)
						}
					})

					// Javob kutilayotgan vaqtda taymer qo'shing
					setTimeout(() => {
						reject(new Error('MQTT response timeout'))
					}, 10000) // Masalan, 10 soniya kutish
				})

				await mqttResponsePromise
			} else {
				throw new Error('MQTT client is not connected')
			}

			const angle_nodes = await this.angleNodeSchema.updateMany(
				{ _id: { $in: nodesId } },
				{ $set: { node_status: false, gateway_id: existGateway._id } }
			)

			await existGateway.updateOne({ $set: { angle_nodes: nodesId } })

			return angle_nodes
		} catch (error) {
			throw new Error(`Error on creating-gateway: ${error.message}`)
		}
	}

	async getGatewaysData() {
		try {
			const gateways = await this.gatewaySchema.find()
			if (!gateways || gateways.length == 0) {
				throw new Error('There is no any gateways in database :(')
			}
			return gateways
		} catch (error) {
			throw error
		}
	}

	async getActiveGatewaysData() {
		try {
			const gateways = await this.gatewaySchema.find({ gateway_status: true })
			if (!gateways || gateways.length == 0) {
				return []
			}
			return gateways
		} catch (error) {
			throw error
		}
	}

	async getSingleGatewayData(gatewayNumber) {
		try {
			const gateway = await this.gatewaySchema.findOne({
				serial_number: gatewayNumber,
			})

			return gateway || null // agar topilmasa, null qaytadi
		} catch (error) {
			throw new Error(`Gateway olishda xatolik: ${error.message}`)
		}
	}

	async getNodesData() {
		try {
			const nodes = await this.nodeSchema.find()
			if (!nodes || nodes.length == 0) {
				throw new Error('There is no any nodes in database :(')
			}
			return nodes
		} catch (error) {
			throw error
		}
	}

	async getActiveNodesData() {
		try {
			const nodes = await this.nodeSchema.find({ node_status: true })
			if (!nodes || nodes.length == 0) {
				return []
			}
			return nodes
		} catch (error) {
			throw error
		}
	}

	async getActiveAngleNodesData() {
		try {
			const angleNodes = await this.angleNodeSchema.find({ node_status: true })

			return angleNodes || null // agar topilmasa, null qaytadi
		} catch (error) {
			throw new Error(`Error on getting Angle-Nodes: ${error.message}`)
		}
	}

	async getProductData(id) {
		try {
			const result = await this.ProductSchema.findById(id)
			return result
		} catch (error) {
			throw new Error('Error on fetching Product by id')
		}
	}

	async downloadNodeHistoryData(buildingId) {
		try {
			const building = await this.buildingSchema.findById(buildingId)

			const buildingGateways = await this.gatewaySchema.find(
				{
					_id: { $in: building.gateway_sets },
				},
				{ serial_number: 1, _id: 0 } // faqat serial_number ni tanlash, _id avtomatik qo'shiladi. shuning uchun (_id ni chiqarishni xohlamasangiz)
			)

			const serialNumbers = buildingGateways.map(
				gateway => gateway.serial_number
			)

			const history = await this.nodeHistorySchema.find({
				gw_number: { $in: serialNumbers },
			})

			// ✅ Validation: history mavjud bo'lmasa xabar qaytarish
			if (!history || history.length === 0) {
				throw new Error('History is not found')
			}

			// 2. doorNum bo‘yicha guruhlab, doorChk = 1 bo‘lganlar sonini hisoblash
			const doorStats = {} // { doorNum: countOfDoorChk1 }

			// Har bir entryni tekshiramiz
			history.forEach(entry => {
				if (entry.doorChk === 1) {
					if (!doorStats[entry.doorNum]) {
						// Agar birinchi marta uchrasa, yangi object ochamiz
						doorStats[entry.doorNum] = {
							doorOpen_count: 1,
							gw_number: entry.gw_number,
							last_open: entry.createdAt,
						}
					} else {
						// Bor bo'lsa, countni oshiramiz
						doorStats[entry.doorNum].doorOpen_count++
						// Sana solishtirib eng oxirgisini olamiz
						if (
							new Date(entry.createdAt) >
							new Date(doorStats[entry.doorNum].last_open)
						) {
							doorStats[entry.doorNum].last_open = entry.createdAt
						}
					}
				}
			})

			// Objectni massivga aylantiramiz
			const result = Object.entries(doorStats).map(([doorNum, data]) => {
				const lastOpenDate =
					typeof data.last_open === 'string'
						? data.last_open
						: new Date(data.last_open).toISOString()

				return {
					doorNum: Number(doorNum),
					doorOpen_count: data.doorOpen_count,
					gw_number: data.gw_number,
					last_open: lastOpenDate.substring(0, 10),
				}
			})

			// ✅ createExcelFile funksiyasini chaqirish
			const buffer = await this.createExcelFile(result)
			return buffer
		} catch (error) {
			console.error('Error generating Excel:', error)
			throw error
		}
	}

	// ✅ Excel fayl yaratish funksiyasi
	async createExcelFile(reportArr) {
		const ExcelJS = require('exceljs')
		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('MQTT Data')

		// ✅ Sarlavhalarni qo'shish
		worksheet.columns = [
			{ header: '노드 넘버', key: 'doorNum', width: 25 },
			{ header: '노드 속한 게이트웨이 넘버', key: 'gw_number', width: 35 },
			{ header: '문 열림 횟수', key: 'doorOpen_count', width: 25 },
			{ header: '마지막 열림 날짜', key: 'last_open', width: 25 },
		]

		// ✅ Header'ni stil qilish
		const headerRow = worksheet.getRow(1)
		headerRow.height = 40
		headerRow.eachCell(cell => {
			cell.font = { bold: true }
			cell.alignment = { horizontal: 'center', vertical: 'middle' }
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFF00' },
			}
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			}
		})

		// ✅ Ma'lumotlarni qo'shish
		reportArr.forEach(item => {
			const row = worksheet.addRow({
				gw_number: item.gw_number,
				doorNum: item.doorNum,
				doorOpen_count: item.doorOpen_count,
				last_open: item.last_open,
			})

			row.height = 35
			row.eachCell({ includeEmpty: true }, cell => {
				cell.alignment = { horizontal: 'center', vertical: 'middle' }
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' },
				}
				cell.font = {
					size: 14, // 📢 Mana shu yerda font kattalashtiriladi (masalan, 14px)
					bold: false, // optional: qalin qilmoqchi bo'lsangiz true qiling
				}
			})

			// ✅ 🔥 `doorOpen_count` uchun rang berish
			const doorOpen_count = row.getCell('doorOpen_count')
			if (item.doorOpen_count >= 100) {
				doorOpen_count.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'ffDB5555' }, //rgb(219, 85, 85)
				}
				doorOpen_count.font = {
					color: { argb: 'FFFFFFFF' }, // ❗️ Oq matn (FF FF FF)
					size: 14,
					bold: true, // optional: qalin qilish uchun
				}
			} else {
				doorOpen_count.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: '69B5F7' }, //rgb(105, 181, 247)
				}
			}
		})

		// ✅ Buffer formatiga o‘girish
		const buffer = await workbook.xlsx.writeBuffer()
		return buffer
	}

	// =============================== Product changing logic ================================== //

	async updateNodeStatusData(nodeId) {
		try {
			const updatingNode = await this.nodeSchema.findOneAndUpdate(
				{ _id: nodeId },
				[{ $set: { node_status: { $not: '$node_status' } } }], // Boolean qiymatni teskarisiga o‘girish
				{ new: true } // Yangilangan ma'lumotni qaytarish
			)

			if (!updatingNode) {
				throw new Error('Node not found')
			}

			return updatingNode
		} catch (error) {
			throw error
		}
	}

	async deleteNodeData(nodeId) {
		try {
			const deletingNode = await this.nodeSchema.findOneAndDelete({
				_id: nodeId,
			})
			if (!deletingNode) {
				throw new Error('Node not found')
			}

			return deletingNode
		} catch (error) {
			console.error('Error deleting node:', error)
			throw error
		}
	}

	async updateGatewayStatusData(gatewayId) {
		try {
			const updatingGateway = await this.gatewaySchema.findOneAndUpdate(
				{ _id: gatewayId },
				[{ $set: { gateway_status: { $not: '$gateway_status' } } }], // Boolean qiymatni teskarisiga o‘girish
				{ new: true } // Yangilangan ma'lumotni qaytarish
			)

			if (!updatingGateway) {
				throw new Error('Node not found')
			}

			return updatingGateway
		} catch (error) {
			throw error
		}
	}

	async deleteGatewayData(gatewayId) {
		try {
			// Gateway mavjudligini tekshirish
			const gateway = await this.gatewaySchema.findById(gatewayId)
			if (!gateway) {
				throw new Error('Gateway not found')
			}

			// Gateway ichidagi node'larni olish
			const nodeIds = gateway.nodes

			// Agar node mavjud bo'lsa, ularni yangilash
			if (nodeIds.length > 0) {
				await this.nodeSchema.updateMany(
					{ _id: { $in: nodeIds } },
					{ $set: { node_status: true } }
				)
			} else {
				throw new Error('Gateway does not contain any nodes')
			}

			// Gateway'ni o‘chirish
			const deletingGateway = await this.gatewaySchema.findOneAndDelete({
				_id: gatewayId,
			})
			if (!deletingGateway) {
				throw new Error('Gateway not found or already deleted')
			}

			// Yangilangan Gateway'larni qaytarish
			const updatedGateways = await this.gatewaySchema.find()
			return updatedGateways
		} catch (error) {
			console.error('Error deleting gateway:', error)
			throw error
		}
	}

	async setNodesPositionData(nodesPosition, buildingId, file) {
		try {
			// Har bir element uchun alohida yangilash
			const updatePromises = nodesPosition.map(async item => {
				const result = await this.nodeSchema.updateMany(
					{ doorNum: item.nodeNum }, // doorNum'ga mos keladigan node'larni yangilash
					{ $set: { position: item.position } } // Har bir node uchun o'zining `position`ini yangilash
				)
				return {
					doorNum: item.nodeNum, // ✅ nodeNum qaytarilyapti
					matchedCount: result.matchedCount,
					modifiedCount: result.modifiedCount,
				}
			})

			const results = await Promise.all(updatePromises)

			// ✅ Topilmagan node'larni ajratib olish
			const noUpdates = results
				.filter(res => res.matchedCount === 0)
				.map(res => res.doorNum) // ✅ Faqat `doorNum` qaytarilyapti

			if (noUpdates.length > 0) {
				return {
					state: 'fail',
					message: `${noUpdates} 번 노드가 발견되지 않았습니다. 파일을 확인하세요!`,
				}
			}

			// file va folderName ni kiritish kerak
			const fileName = fileService.save(file, 'exels')

			const building = await this.buildingSchema.findById(buildingId)
			if (building) {
				const oldFilename = building.nodes_position_file

				if (oldFilename && oldFilename.trim() !== '') {
					fileService.delete(oldFilename)
				}

				await this.buildingSchema.findByIdAndUpdate(
					buildingId,
					{ nodes_position_file: fileName },
					{ new: true }
				)
			}

			return {
				message: `${nodesPosition.length}개 노드가 성공적으로 배치되었습니다.`,
			}
		} catch (error) {
			console.error('Error on node positioning:', error)
			throw new Error('Error on node positioning.') // ✅ Yangi `Error` obyektini qaytarish
		}
	}
}

module.exports = ProductService
