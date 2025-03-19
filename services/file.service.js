const fs = require('fs') // file system
const fsPromises = require('fs').promises // file system
const path = require('path')

class FileService {
	save(file, uploadFolder) {
		try {
			// // ✅ Fayl nomini UTF-8 kodlashga o‘tkazish
			const fileName = Buffer.from(file.name, 'latin1').toString('utf8')
			const currentDir = __dirname // current direction
			const staticDir = path.join(currentDir, '..', 'static', `${uploadFolder}`) // static direktoriya qilyapmiz
			const filePath = path.join(staticDir, fileName) // Static papkani ichiga fileName (file) ni qo'shyapmiz
			// console.log(fileName, filePath)

			if (!fs.existsSync(staticDir)) {
				fs.mkdirSync(staticDir, { recursive: true })
			}

			file.mv(filePath, () => console.log('Fayl saqlandi.'))
			return fileName
		} catch (error) {
			throw new Error(`Error on saving file: ${error.message}`)
		}
	}

	async delete(fileName) {
		try {
			const filePath = path.normalize(
				path.join(__dirname, '../static/exels', fileName)
			)

			// Faylni o‘chirish
			await fsPromises.unlink(filePath)
			console.log(`${fileName} fayli o‘chirildi.`)
		} catch (error) {
			console.error(`Xatolik kodi: ${error.code}`)
			if (error.code === 'ENOENT') {
				return new Error(`Error on deleting file: File not found`)
			} else {
				return new Error(`Error in deleting file: ${error.message}`)
			}
		}
	}
}

module.exports = new FileService()
