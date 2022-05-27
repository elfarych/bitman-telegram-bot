const config = require('../config')
const axios = require('axios')

const percentDifference = (val1, val2) => {
    if (typeof val1 === 'string' || typeof val2 === 'string') {
        val1 = parseFloat(val1)
        val2 = parseFloat(val2)
    }
    return Math.abs((val2 - val1) / val1 * 100)
}


const formatBigSum = (val) => {
    return new Intl.NumberFormat('ru', {
        maximumFractionDigits: 0
    }).format(val) + '$'
}

const setGlobals = () => {
    global.logger = (log) => console.log(log)
    global.errorHandler = (err) => console.log(err.message)
    global.$appConfig = config
    global.$axios = axios
    global.percentDifference = percentDifference
    global.formatBigSum = formatBigSum
}


module.exports = {
    setGlobals
}
