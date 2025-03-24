require('dotenv').config()
const express = require('express')
const http = require('http')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const user_router = require('./routes/User.route')
const product_router = require('./routes/Product.route')
const cors = require('cors')
const { Server } = require('socket.io')
const company_router = require('./routes/compnay.route')
const { setupSocket } = require('./services/Socket.service')
const fileUpload = require('express-fileupload')
const app = express()
const server = http.createServer(app)

// request allowed domains
const allowedOrigins = [
	'https://infogssiot.com',
	'http://52.79.50.40:3001',
	'http://52.79.50.40',
	'http://localhost:5173',
]

const io = new Server(server, {
	cors: {
		origin: allowedOrigins, // Specify the frontend's URL
		methods: ['GET', 'POST'],
		credentials: true,
	},
})

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload())
app.use(express.static('static'))
app.use(
	cors({
		// origin: true,
		origin: function (origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('CORS policy violation'))
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	})
)

app.get('/', (req, res) => {
	res.send('Welcome to GSSIOT projects new Server! :)')
})

app.use('/auth', user_router)
app.use('/product', product_router)
app.use('/company', company_router)

setupSocket(io)

const PORT = process.env.PORT || 3000

const startServer = async () => {
	try {
		mongoose
			.connect(
				`mongodb+srv://Muhammad_Yusuf:${process.env.DB_PASSWORD}@papay.qzqt3.mongodb.net/GSS-FIGMA-DB?retryWrites=true&w=majority`
			)
			.then(() => console.log('MongoDB Atlas connected successfully'))
			.catch(error => console.error('MongoDB Atlas connection error:', error))

		server.listen(PORT, () => {
			console.log(`Server is running successfully on: http://localhost:${PORT}`)
		})
	} catch (error) {
		console.log(`Error: ${error}`)
	}
}

startServer()
