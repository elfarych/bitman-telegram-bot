const config = require('../config')

const setGlobals = () => {
    global.logger = (log) => console.log(log)
    global.errorHandler = (err) => console.log(err.message)
    global.appConfig = config
}

module.exports = {
    setGlobals
}