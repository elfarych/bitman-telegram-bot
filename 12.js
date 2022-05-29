const axios = require('axios')

const getDifferencePercent = (val1, val2) => {
    if (typeof val1 === 'string' || typeof val2 === 'string') {
        val1 = parseFloat(val1)
        val2 = parseFloat(val2)
    }
    return (val2 - val1) / val1 * 100
}

global.$errorHandler = (err) => console.log(err.message || err)
global.$getDifferencePercent = getDifferencePercent



async function loadMarket () {
    try {
        await axios('https://api.hotbit.io/api/v1/market.status24h')
            .then(res => {
                marketDataHandler(res.data.result || {})
            })
    } catch (err) {
        $errorHandler(err)
    }
}



function marketDataHandler (data) {
    const dataArr = []
    for (let key in data) {
        if (key.endsWith('USDT')) {
            dataArr.push({
                symbol: key,
                ...data[key]
            })
        }
    }
    const filteredData = dataArr.filter(coin => {
        return parseFloat(coin.quote_volume) > 1000 && parseFloat(coin.quote_volume) < 30000 // Отсеивание по объему
    })
    console.log('data filtered', filteredData.length)
    if (filteredData.length) {
        ordersLoader(filteredData).then(() => console.log('end...'))
    }
}



const updatedCoins = []

async function ordersLoader (data = [], index = 0) {
    const coin = data[index]
    try {
        await axios('https://api.hotbit.io/api/v1/order.depth', {
            params: {
                market: coin.symbol.replace('USDT', '') + '/USDT',
                limit: 100,
                interval: coin
            }
        }).then(res => {
            const asks = res?.data?.result?.asks || []

            if (hasDensity(asks, coin)) {
                let ordersSum = 0
                asks.forEach(order => {
                    const orderSum = parseFloat(order[0]) * parseFloat(order[1])
                    ordersSum += orderSum
                })
                coin.difference = $getDifferencePercent(coin.quote_volume, ordersSum)
                updatedCoins.push(coin)
            }
        })
    } catch (err) {
        $errorHandler(err)
    }

    console.log(index, data.length)

    if (data.length - 1 === index) {
        console.log('Coins ', updatedCoins.length)
        const sortedCoins = updatedCoins.sort((a, b) => a.difference < b.difference ? 1 : -1)
        console.log(sortedCoins)
    } else {
        index ++
        await ordersLoader(data, index)
    }
}



function hasDensity (orders, coin) {
    let hasDensity = false
    orders.forEach(order => {
        if (parseFloat(order[0]) * parseFloat(order[1]) >= 500 && Math.abs($getDifferencePercent(order[0], coin.last)) < 2000) {
            hasDensity = true
        }
    })

    return hasDensity
}




loadMarket().then(() => console.log('market loaded...'))
