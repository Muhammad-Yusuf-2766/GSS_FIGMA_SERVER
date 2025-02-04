const assert = require('assert')
const UserSchema = require('../schema/User.model')
const bcrypt = require('bcryptjs')
const BaseError = require('../errors/base.error')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const Otp = require('../schema/Otp.model')

class UserService {
	constructor() {
		this.userSchema = UserSchema
		this.otpSchema = Otp
	}
	async registerData(data) {
		try {
			const existUser = await this.userSchema.findOne({
				user_email: data.user_email,
			})
			const existNumber = await this.userSchema.findOne({
				user_phone: data.user_phone,
			})

			if (existUser) {
				console.log('EXIST Email:::')
				throw BaseError.UnauthorizedError(
					'User is already registered  with this email'
				)
			} else if (existNumber) {
				console.log('EXIST Phone:::')
				throw BaseError.UnauthorizedError('This phone is already taken')
			}

			const salt = await bcrypt.genSalt()
			data.user_password = await bcrypt.hash(data.user_password, salt)

			const new_user = new this.userSchema(data)
			const result = new_user.save()

			result.user_password = ''
			return result
		} catch (error) {
			throw error
		}
	}

	async loginData(data) {
		const user = await this.userSchema
			.findOne(
				{ user_email: data.user_email },
				{ user_name: 1, user_password: 1 }
			)
			.exec()

		if (!user) {
			throw BaseError.BadRequest(`Not found  user: ${data.user_email}`)
		}
		const isPwTrue = await bcrypt.compare(
			data.user_password,
			user.user_password
		)
		assert.ok(isPwTrue, BaseError.BadRequest('Passwrod is incorrect'))

		return await this.userSchema.findOne({
			user_email: data.user_email,
		})
	}

	async logout(access_token) {
		const token = await TokenService.removeToken(access_token)
		return token
	}

	async getUsers() {
		try {
			const users = await this.userSchema.find()
			if (!users || users.length == 0) {
				throw new Error('There is no any users in database :(')
			}
			return users
		} catch (error) {
			throw error
		}
	}

	async updateUserTypesData(data) {
		try {
			const user = await this.userSchema.findByIdAndUpdate(
				{ _id: data.user_id },
				{ user_type: data.user_type }, // The update object that sets user_type to "CLIENT"
				{ new: true } // Options: return the updated document
			)
			if (!user) {
				throw new Error('There is no this kind of user :(')
			}

			return user
		} catch (error) {
			throw new Error('There is Error with this user :(' + error)
		}
	}

	async deletingUserData(user_id) {
		try {
			const user = await this.userSchema.findByIdAndDelete(user_id)
			if (!user) {
				throw new Error('There is no this kind of user :(')
			}

			return user
		} catch (error) {
			throw new Error('There is Error with this user :(' + error)
		}
	}

	async retrieveClient(jwtUser) {
		try {
			const user = await this.userSchema.findById(jwtUser._id)
			if (!user) {
				return { state: 'fail', message: 'not found authenticate user' }
			}

			if (user.user_type !== 'CLIENT') {
				return {
					state: 'fail',
					message: 'You are not authenticated CLIENT type user',
				}
			}

			return { state: 'success', data: user }
		} catch (error) {
			return new Error('Error on retrieving authenticate user')
		}
	}

	async retrieveAdmin(jwtUser) {
		try {
			const user = await this.userSchema.findById(jwtUser._id)
			if (!user) {
				return { state: 'fail', message: 'not found authenticate user' }
			}

			if (user.user_type !== 'ADMIN') {
				return {
					state: 'fail',
					message: 'You are not authenticated ADMIN type user',
				}
			}

			return { state: 'success', data: user }
		} catch (error) {
			return new Error('Error on retrieving authenticate user')
		}
	}

	async resetPwRequest(user_email) {
		try {
			// Check user
			const user = await this.userSchema.findOne({ user_email })
			if (!user) {
				throw new Error('There is no user with this email :(')
			}

			// OTP creation
			const otp = crypto.randomInt(100000, 999999) // 6 ta raqamli
			await this.otpSchema.deleteMany({ user_email })
			// OTPni saqlash
			const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 daqiqaga amal qiladi
			const newOtp = new this.otpSchema({
				user_email,
				otp,
				expiresAt: otpExpiry,
			})

			await newOtp.save()
			// Email jo'natish
			const transporter = nodemailer.createTransport({
				service: 'gmail', // Gmail ishlatilsa
				auth: {
					user: 'strangerbellimo@gmail.com',
					pass: 'zyls xjxp obtg cizx',
				},
			})

			const mailOptions = {
				from: 'strangerbellimo@gmail.com',
				to: user_email,
				subject: 'Password Reset OTP',
				text: `OTP 코드입니다: ${otp}. 이 OTP 코드는 5분 동안만 유효합니다.`,
			}

			console.log('OTP:', newOtp)
			await transporter.sendMail(mailOptions)
			return {
				state: 'success',
				message: 'OTP 코드가 전송되었습니다, 이메일을 확인해보세요',
			}
		} catch (error) {
			throw new Error(error)
		}
	}

	async resetPwVerify(user_email, otp, new_password) {
		try {
			const storedOtp = await this.otpSchema.findOne({ user_email, otp })
			if (!storedOtp) {
				throw new Error('Invalid OTP')
			}

			// Checking OTP expire date
			if (storedOtp.expiresAt < new Date()) {
				await this.otpSchema.deleteOne({ user_email, otp })
				throw new Error('This OTP is already expired, try again')
			}

			if (String(otp).trim() !== storedOtp.otp.toString().trim()) {
				console.log('OTP mismatch: ', otp, storedOtp.otp)
				throw new Error('OTP code is not matching, please check out your email')
			}

			const user = await this.userSchema.findOne({ user_email })
			if (!user) {
				throw new Error('User is not found in database')
			}

			const salt = await bcrypt.genSalt()
			user.user_password = await bcrypt.hash(new_password, salt)
			console.log('Service user:', user)

			await user.save()
			return { state: 'success', message: 'Password updated successfully' }
		} catch (error) {
			throw new Error(error)
		}
	}
}

module.exports = UserService
