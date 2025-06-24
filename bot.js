require('dotenv').config();
const axios = require('axios');
const { RSI } = require('technicalindicators');

const symbol = 'BTCUSDT';
const interval = '15'; // 15 minutos
const limit = 100;

async function fetchCandles() {
  const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await axios.get(url);
  return response.data.result.list.map(candle => parseFloat(candle[4])); 
}

async function main() {
  const closes = await fetchCandles();
  const rsi = RSI.calculate({ values: closes, period: 14 });
  const lastRsi = rsi[rsi.length - 1];

  console.log(`RSI atual: ${lastRsi}`);

  if (lastRsi < 30) {
    console.log('🔵 Sinal de COMPRA');
    // Aqui você chamaria a API da Bybit para comprar
  } else if (lastRsi > 70) {
    console.log('🔴 Sinal de VENDA');
    // Aqui você chamaria a API da Bybit para vender
  } else {
    console.log('⚪ Sem sinal claro');
  }
}

main();
