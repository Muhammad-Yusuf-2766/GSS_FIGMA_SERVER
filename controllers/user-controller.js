const assert = require('assert')
const UserService = require('../services/user.service')
const jwt = require('jsonwebtoken')
const path = require('path')
const UserSchema = require('../Schema/User.model')

let userController = module.exports

userController.register = async (req, res, next) => {
	try {
		console.log('request: register')
		const data = req.body
		const userService = new UserService()
		const new_user = await userService.registerData(data)

		// JWT related logic
		const token = userController.createToken(new_user)
		res.cookie('access_token', token, {
			maxAge: 10 * 24 * 3600 * 1000,
			httpOnly: true,
			sameSite: 'none',
			secure: true,
		})

		res.status(200).json({ state: 'success', user: new_user })
	} catch (error) {
		console.log('Error', error.message)
		res.json({ state: 'fail', message: error.message })
	}
}

userController.login = async (req, res, next) => {
	try {
		console.log('POST: contr.User-Login')
		const data = req.body
		const userService = new UserService()
		const user = await userService.loginData(data)
		// JWT related logic
		const token = userController.createToken(user)
		res.cookie('access_token', token, {
			maxAge: 10 * 24 * 3600 * 1000,
			httpOnly: true,
			// sameSite: 'None', // Cookie'ni cross-site so'rovlarida saqlash
			secure: true, // faqat https da cookie ni saqlaydi,
			sameSite: 'none',
			// path: '/', // barcha endpointlar uchun
		})

		return res.status(200).json({ state: 'success', data: user, token: token })
	} catch (error) {
		console.log('ERROR: contr.User-Login', error)
		res.status(401).json({ state: 'fail', message: error.message })
	}
}

userController.checkUser = async (req, res) => {
	try {
		console.log('request: Check me')
		const token = req.cookies.access_token
		if (!token) return res.status(401).send('Unauthorized')

		const isVerified = jwt.verify(token, process.env.JWT_SECRET_KEY)

		const user = await UserSchema.findById(isVerified._id)
		if (!user) {
			res.clearCookie('access_token')
			return res.json({ state: 'fail', user: 'Not found' })
		}
		return res.json({ state: 'success', user: user })
	} catch (error) {
		res.send(error)
	}
}

userController.logout = async (req, res, next) => {
	console.log('POST: contr.User-Logout')
	res.clearCookie('access_token')
	return res.json({ state: 'success' })
}

userController.getUsers = async (req, res, next) => {
	try {
		console.log('request: get-users')
		const userService = new UserService()
		const users = await userService.getUsers()
		return res.json({ state: 'success', users: users })
	} catch (error) {
		console.log('ERROR: contr.User: getUser', error)
		res.json({ state: 'fail', message: error.message })
	}
}

userController.updateUserType = async (req, res) => {
	try {
		console.log('request: updateUserType')
		const data = req.body
		const userService = new UserService()
		const result = await userService.updateUserTypesData(data)
		console.log('Changed user', data)
		res.json({ state: 'success', user: result })
	} catch (error) {
		console.log('ERROR: updateUserType', error)
		res.json({ state: 'fail', message: error.message })
	}
}

userController.deleteUser = async (req, res) => {
	try {
		console.log('request: deleteUser')
		const { user_id } = req.body
		console.log(req.body)

		const userService = new UserService()
		const result = await userService.deletingUserData(user_id)
		res.json({ state: 'success', user: result })
	} catch (error) {
		console.log('ERROR: updateUserType', error)
		res.json({ state: 'fail', message: error.message })
	}
}

userController.makeUser = async (req, res) => {
	try {
		console.log('request: Make-User', req.body)
		const user_id = req.body
		const userService = new UserService()
		const data = await userService.makeUserData(user_id)
		res.json({ state: 'success', user: data })
	} catch (error) {
		console.log('ERROR: contr.User: Make-User', error)
		res.json({ state: 'fail', message: error.message })
	}
}

userController.resetPwRequest = async (req, res) => {
	try {
		console.log('request: reset-password', req.body)
		const { user_email } = req.body
		const userService = new UserService()
		const result = await userService.resetPwRequest(user_email)
		return res
			.status(200)
			.json({ state: result.state, message: result.message })
	} catch (error) {
		console.log('ERROR: resetPwResquest', error)
		res.json({ state: 'fail', message: error.message })
	}
}
userController.resetPwVerify = async (req, res) => {
	try {
		console.log('POST: contr.User: resetPwVerify', req.body)
		const { user_email, otp, new_password } = req.body
		const userService = new UserService()
		const result = await userService.resetPwVerify(
			user_email,
			otp,
			new_password
		)
		return res
			.status(200)
			.json({ state: result.state, message: result.message })
	} catch (error) {
		console.log('ERROR: contr.User: resetPwResquest', error)
		res.json({ state: 'fail', message: error.message })
	}
}

// ======== JWT creation Mehtod ======== //

userController.createToken = user => {
	try {
		const upload_data = {
			_id: user._id,
			user_name: user.user_name,
			user_email: user.user_email,
			user_title: user.user_title,
			user_type: user.user_type,
		}

		const token = jwt.sign(upload_data, process.env.JWT_SECRET_KEY, {
			expiresIn: '10d',
		})

		assert.ok(token, 'There is no any Token Key :(')
		return token
	} catch (error) {
		throw error
	}
}

// ======== JWT related Mehtod ======== //
