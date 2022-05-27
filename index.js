const express = require('express')
const cors = require('cors')

const globalFunctions = require('./utils/global-functions')
const densityScreener = require('./app/density-screener')
require('dotenv').config()
const app = express()


app.use(cors())
app.use(express.json({ limit: '10mb' }))
globalFunctions.setGlobals()


const { APP_PORT, APP_IP, APP_PATH } = process.env
densityScreener.start()


app.listen(APP_PORT, APP_IP, () => {
    console.log(`server started ${APP_IP}:${APP_PORT}`)
})









