const isDev = process.env.DEBUG_LOGER !== 'production'

function logger(...args) {
	if (isDev) console.log(...args)
}

function logInfo(...args) {
	if (isDev) console.info(...args)
}

function logWarn(...args) {
	if (isDev) console.warn(...args)
}

function logError(...args) {
	if (isDev) console.error(...args)
}

module.exports = { logger, logInfo, logWarn, logError }
