const coinCandles = async (coin, densitySum, densityPrice) => {
    try {
        await $axios(`${$appConfig.binanceSpotAPI}/api/v3/klines`, {
            params: {
                symbol: coin.symbol,
                limit: 1,
                interval: '1h'
            }
        })
            .then(res => {
                const candle = res.data[0]
                const volume = parseFloat(candle[7])
                const fiveMinVolume = volume / 12

                if (fiveMinVolume > densitySum / 2) {
                    console.log(`Find ${coin.symbol} (${coin.price}), ${densitySum}, ${densityPrice} (5m ${fiveMinVolume})`)
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
            if (percentDifference(price, coin.price) < 3) {
                coinCandles(coin, sum, price)
            }
        }
    })
}


const ordersHandles = (orders = {}, coin = {}) => {
    const bids = orders.bids || []
    const asks = orders.asks || []
    densityFinder(bids, 300000,  coin)
    densityFinder(asks, 300000, coin)
}

const loadOrdersBooks = async (coins = [], index = 0) => {
    const coin = coins[index]
    try {
        await $axios(`${$appConfig.binanceSpotAPI}/api/v3/depth`, {
            params: {
                symbol: coin.symbol,
                limit: 1000
            }
        })
            .then(res => {
                ordersHandles(res.data, coin)
            })
    } catch (e) {
        errorHandler(e)
    }
    if (index < coins.length - 1) {
        await loadOrdersBooks(coins, index += 1)
    }
}


const loadCoins = async () => {
    try {
        await $axios.get(`${$appConfig.binanceFuturesAPI}/fapi/v1/ticker/price`)
            .then(res => {
                loadOrdersBooks(res.data)
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
