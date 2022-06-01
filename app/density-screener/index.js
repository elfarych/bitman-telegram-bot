const axios = require("axios");

const coinCandles = async (coin, densitySum, densityPrice) => {
    let densityInDB = false
    try {
        await $axios(`${$appConfig.backendURL}/density/`, {
            params: {
                symbol: coin.symbol,
                density_sum: parseInt(densitySum)
            }
        }).then(res => {
            densityInDB = !!res.data.results.length
        })
    } catch (e) {
        errorHandler(e)
    }

    if (densityInDB) {
        console.log('in base')
        return null
    }

    try {
        await $axios(`${$appConfig.binanceSpotAPI}/api/v3/klines`, {
            params: {
                symbol: coin.symbol,
                limit: 2,
                interval: '1h'
            }
        })
            .then(res => {
                const candle = res.data[0]
                const volume = parseFloat(candle[7])
                const fiveMinVolume = volume / 12

                if (fiveMinVolume < densitySum) {

                    axios.post(`${$appConfig.backendURL}/density/create/`, {
                        symbol: coin.symbol,
                        price: coin.price,
                        density_price: densityPrice,
                        density_sum: parseInt(densitySum),
                        density_sum_formatted: formatBigSum(densitySum),
                        symbol_5_min_volume: fiveMinVolume,
                        symbol_5_min_volume_formatted: formatBigSum(fiveMinVolume)
                    })
                }
            })
    } catch (e) {
        errorHandler(e)
    }
}

const densityFinder = (orders = [], density = 300000, coin) => {
    orders.forEach(order => {
        const price = parseFloat(order[0])
        const qty = parseFloat(order[1])
        const sum = price * qty

        if (sum >= density) {

            if (percentDifference(price, coin.price) <= 2) {
                coinCandles(coin, sum, price)
            }
        }
    })
}

const getDensity = (coin) => {
    if (!coin.symbol) return 0
    const symbol = coin.symbol.replace('USDT', '')
    switch (symbol) {
        case 'BTC':
            return 5000000
        case 'ETH':
            return 3000000
        case 'BNB':
            return 2000000
        case 'XRP':
            return 1000000
        default:
            return 300000
    }
}

const ordersHandles = (orders = {}, coin = {}) => {
    const bids = orders.bids || []
    const asks = orders.asks || []
    const density = getDensity(coin)
    densityFinder(bids, density,  coin)
    densityFinder(asks, density, coin)
}

const loadOrdersBooks = async (coins = [], index = 0) => {
    const coin = coins[index]
    try {
        await $axios(`${$appConfig.binanceSpotAPI}/api/v3/depth`, {
            params: {
                symbol: coin.symbol,
                limit: 5000
            }
        })
            .then(res => {
                ordersHandles(res.data, coin)
                console.log(coin.symbol + ' orders loaded...')
            })
    } catch (e) {
        errorHandler(e)
    }

    setTimeout(() => {
        if (index <= coins.length - 1) {
            loadOrdersBooks(coins, index += 1)
        } else {
            start()
        }
    }, 1500)
}


const loadCoins = async () => {
    try {
        await $axios.get(`${$appConfig.binanceFuturesAPI}/fapi/v1/ticker/price`)
            .then(res => {
                loadOrdersBooks(res.data.filter(item => !item.symbol.endsWith('BUSD')))
            })
    } catch (e) {
        errorHandler(e)
    }
}

const start = () => {
    loadCoins().then(() => logger(`${ new Date() } coins loaded`))
}

module.exports = {
    start
}
