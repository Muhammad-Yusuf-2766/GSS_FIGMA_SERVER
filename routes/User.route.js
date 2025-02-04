const express = require('express')
const user_router = express.Router()
const userController = require('../controllers/user-controller')

user_router.post('/register', userController.register)
user_router.post('/login', userController.login)
user_router.post('/update-user-types', userController.updateUserType)
user_router.post('/delete-user', userController.deleteUser)
user_router.post('/reset-password', userController.resetPwRequest)
user_router.post('/password-verify', userController.resetPwVerify)
user_router.get('/check-user', userController.checkUser)
user_router.get('/logout', userController.logout)
user_router.get('/get-users', userController.getUsers)

module.exports = user_router
