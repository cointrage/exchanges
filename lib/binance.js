/**
 * Binance API client.
 */

const request = require('request');
const crypto = require('crypto');
const debug = require('debug')('cointrage:exchanges:binance');
const config = require('../config');

const API_URL = 'https://api.binance.com';
const DEFAULT_ORDEBOOK_DEPTH = 50;

const MARKETS = config.MARKETS;
const API_KEY = config.Binance.api_key;
const API_SECRET = config.Binance.api_secret;

/**
 * Mappings tickets to standard.
 */
const STANDARD_MAPPINGS = {
    'BCC': 'BCH'
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `https://www.binance.com/exchange/public/product`;
    debug(`Getting markets list from url ${url}...`);

    request({
        uri: url,
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;
        for (let m of body.data) {
            if (!m.active || m.status !== 'TRADING') {
                continue;
            }

            let market = m.quoteAsset;
            let ticker = m.baseAsset;

            if (STANDARD_MAPPINGS[ticker]) {
                ticker = STANDARD_MAPPINGS[ticker];
            }

            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            markets[market].push(ticker);
        }

        debug(`Found ${counter} markets`);

        resolve(markets);
    });

});

const getOrderBook = (market, ticker, depth) => new Promise((resolve, reject) => {

    if (!depth) {
        depth = DEFAULT_ORDEBOOK_DEPTH;
    }

    for (let mp in STANDARD_MAPPINGS) {
        if (STANDARD_MAPPINGS[mp] === ticker) {
            ticker = mp;
        }
    }

    const mapOrder = (o) => {
        return {
            rate: +o[0],
            quantity: +o[1]
        };
    };

    const marketTicker = ticker + market;

    const url = `${API_URL}/api/v1/depth?symbol=${marketTicker}&limit=${depth}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}`);

    request({
        uri: url,
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            if (response.statusCode === 400 && body.code === -1121) {
                // invalid symbol
                return reject(`Invalid symbol: ${marketTicker}`);
            } else {
                // some other error
                return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
            }
        }

        if (STANDARD_MAPPINGS[ticker]) {
            ticker = STANDARD_MAPPINGS[ticker];
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            bids: body.bids ? body.bids.map(o => mapOrder(o)) : [],
            asks: body.asks ? body.asks.map(o => mapOrder(o)) : []
        };

        resolve(res);
    });

});

const getAccountInfo = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/account?${query}&signature=${signature}`;
    debug(`Getting account url from url ${url}`);

    request({
        uri: url,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const createOrder = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/order?${query}&signature=${signature}`;
    debug(`Creating new order`);

    request({
        uri: url,
        json: true,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        method: 'POST'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const getOrder = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/order?${query}&signature=${signature}`;
    debug(`Getting account url from url ${url}`);

    request({
        uri: url,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const getAllOrders = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/allOrders?${query}&signature=${signature}`;
    debug(`Getting account url from url ${url}`);

    request({
        uri: url,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const getOpenOrders = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/openOrders?${query}&signature=${signature}`;
    debug(`Getting account url from url ${url}`);

    request({
        uri: url,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const cancelOrder = (data) => new Promise((resolve, reject) => {

    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/api/v3/order/?${query}&signature=${signature}`;
    debug(`Creating new order`);

    request({
        uri: url,
        json: true,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        method: 'DELETE'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const withdraw = (data) => new Promise((resolve, reject) => {
    data.name = 'API Withdraw';
    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/wapi/v3/withdraw.html?${query}&signature=${signature}`;
    debug(`Withdrawing funds`);

    request({
        uri: url,
        json: true,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        method: 'POST'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const getDepositAddress = (data) => new Promise((resolve, reject) => {
    data.name = 'API Withdraw';
    let [query, signature] = prepRequestParams(data);

    const url = `${API_URL}/wapi/v3/depositAddress.html?${query}&signature=${signature}`;
    debug(`Getting asset address`);

    request({
        uri: url,
        json: true,
        headers: {
            'X-MBX-APIKEY': API_KEY
        },
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        resolve(body);
    });

});

const prepRequestParams = (data) => {
    data.timestamp = new Date().getTime();
    if (typeof data.recvWindow === 'undefined') data.recvWindow = config.Binance.recv_window;
    let query = Object.keys(data).reduce(function(a,k){a.push(k+'='+encodeURIComponent(data[k]));return a},[]).join('&');
    let signature = crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');

    return [query, signature];
};

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook,

    getAccountInfo: getAccountInfo,

    createOrder: createOrder,

    getOrder: getOrder,

    getAllOrders: getAllOrders,

    getOpenOrders: getOpenOrders,

    cancelOrder: cancelOrder,

    withdraw: withdraw,

    getDepositAddress: getDepositAddress

};
