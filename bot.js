require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { RSI } = require('technicalindicators');

const apiKey = process.env.BYBIT_API_KEY;
const apiSecret = process.env.BYBIT_API_SECRET;

let inPosition = false;

const getSignature = (params, secret) => {
  const orderedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
};

const placeSpotOrder = async (symbol, side, qty) => {
  const endpoint = 'https://api.bybit.com/spot/v1/order';
  const timestamp = Date.now();

  const params = {
    api_key: apiKey,
    symbol,
    side,          
    type: 'MARKET',
    qty,
    timestamp,
  };

  params.sign = getSignature(params, apiSecret);

  try {
    const res = await axios.post(endpoint, null, { params });
    console.log(` Ordem ${side} enviada:`, res.data);
  } catch (err) {
    console.error(' Erro ao enviar ordem Spot:', err.response ? err.response.data : err.message);
  }
};

const fetchCandles = async (symbol = 'BTCUSDT') => {
  try {
    const res = await axios.get('https://api.bybit.com/v5/market/kline', {
      params: {
        category: 'spot',
        symbol,
        interval: '5',
        limit: 100,
      },
    });

    const closePrices = res.data.result.list.map(candle => parseFloat(candle[4])).reverse();
    return closePrices;
  } catch (err) {
    console.error('Erro ao buscar candles:', err.message);
    return [];
  }
};

const runBot = async () => {
  const symbol = 'BTCUSDT';
  const qty = '0.00001'; // Ajuste conforme sua conta
  const closes = await fetchCandles(symbol);

  if (closes.length < 14) {
    console.log(' Dados insuficientes para calcular RSI.');
    return;
  }

  const rsi = RSI.calculate({ values: closes, period: 14 });
  const latestRSI = rsi[rsi.length - 1];
  console.log(` RSI atual: ${latestRSI.toFixed(2)}`);

  if (latestRSI < 30 && !inPosition) {
    console.log(' RSI abaixo de 30. Enviando ordem de COMPRA...');
    await placeSpotOrder(symbol, 'BUY', qty);
    inPosition = true;
  } else if (latestRSI > 70 && inPosition) {
    console.log(' RSI acima de 70. Enviando ordem de VENDA...');
    await placeSpotOrder(symbol, 'SELL', qty);
    inPosition = false;
  } else {
    console.log(' Nenhuma ação necessária.');
  }
};


setInterval(runBot, 5 * 60 * 1000);
runBot(); 
