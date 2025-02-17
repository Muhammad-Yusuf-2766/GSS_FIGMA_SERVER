const { Telegraf } = require('telegraf') // Import qilishning to‘g‘ri usuli
const mongoose = require('mongoose')
const NodeSchema = require('../schema/Node.model')
const User = require('../schema/User.model') // User modelini chaqirish
const BuildingSchema = require('../schema/Building.model')
const axios = require('axios')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN) // .env dan bot tokenni olish

bot.start(async ctx => {
	try {
		const telegramId = ctx.from.id
		const args = ctx.message.text.split(' ')
		let userId = args[1]

		if (!userId) {
			return ctx.reply(
				'Saytdagi profilingiz bilan bog‘lash uchun to‘g‘ri link orqali keling.'
			)
		}

		// MongoDB ObjectId formatiga o‘tkazish
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return ctx.reply('❌ Noto‘g‘ri foydalanuvchi ID!')
		}
		userId = new mongoose.Types.ObjectId(userId)

		// MongoDB dagi foydalanuvchini topish
		const user = await User.findById(userId)
		if (!user) {
			return ctx.reply(
				'Sizning profilingiz topilmadi. Iltimos, avval saytda ro‘yxatdan o‘ting.'
			)
		}

		// Telegram ID ni saqlash
		user.telegram_id = String(telegramId)
		await user.save()

		ctx.reply('✅ Sizning Telegram akkauntingiz muvaffaqiyatli bog‘landi!')
	} catch (error) {
		console.error('Xatolik:', error)
		ctx.reply('❌ Foydalanuvchi ma‘lumotlarini saqlashda xatolik yuz berdi.')
	}
})

bot.launch() // Botni ishga tushiramiz
console.log('🤖 Telegram bot ishga tushdi!')

async function notifyUsersOfOpenDoor(doorNum) {
	try {
		// 1. NodeSchema orqali gateway_id ni olish
		const node = await NodeSchema.findOne({ doorNum })
		if (!node || !node.gateway_id) {
			console.log(`❌ Gateway ID topilmadi (doorNum: ${doorNum})`)
			return
		}

		// 2. BuildingSchema orqali users arrayni olish
		const building = await BuildingSchema.findOne({
			gateway_sets: node.gateway_id,
		})
		if (!building || !building.users || building.users.length === 0) {
			console.log(
				`❌ Building topilmadi yoki hech qanday user yo‘q (gateway_id: ${node.gateway_id})`
			)
			return
		}

		// 3. Userlarning Telegram ID larini olib, ularga xabar yuborish
		const users = await User.find({ _id: { $in: building.users } })
		const telegramUsers = users.filter(user => user.telegram_id) // Telegram ID si bor userlar

		if (telegramUsers.length === 0) {
			console.log('❌ Hech qanday bog‘langan Telegram foydalanuvchi yo‘q.')
			return
		}

		const message = `🚪 ${doorNum} raqamli node eshki ochiq! Iltimos, tekshirib ko‘ring. route: building:${building.building_name}, building-number:${building.building_num}. infogssiot.com/client/dashboard/clients`

		for (const user of telegramUsers) {
			await sendTelegramMessageToUser(user._id, message)
		}

		console.log(
			`✅ ${telegramUsers.length} ta foydalanuvchiga xabar yuborildi.`
		)
	} catch (error) {
		console.error('Xatolik:', error)
	}
}

// ========== Telegram message Sender to users ========= //
async function sendTelegramMessageToUser(userId, message) {
	const user = await User.findById(userId)
	if (!user || !user.telegram_id) {
		console.log('Foydalanuvchining Telegram ID si yo‘q.')
		return
	}

	try {
		const telegramApiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
		await axios.post(telegramApiUrl, {
			chat_id: user.telegram_id,
			text: message,
		})
		console.log('✅ Xabar yuborildi!')
	} catch (error) {
		console.error('Xabar yuborishda xatolik:', error)
	}
}

module.exports = { bot, notifyUsersOfOpenDoor } // Express serverda foydalanish uchun eksport qilamiz
