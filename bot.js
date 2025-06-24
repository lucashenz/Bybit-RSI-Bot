require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const { RSI } = require('technicalindicators');

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

const symbol = 'BTCUSDT';
const interval = 'D1';
const limit = 100;

async function fetchCandles() {
  const url = `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await axios.get(url);
  return response.data.result.list.map(candle => parseFloat(candle[4])); 
}

async function sendOrder({ side = "Buy", qty = "0.00001", symbol = "BTCUSDT" }) {
  const timestamp = Date.now().toString();
  const url = "https://api.bybit.com/v5/order/create";

  const headers = {
    "X-BYBIT-API-KEY": API_KEY,
    "X-BYBIT-SIGN": signature,
    "X-BYBIT-TIMESTAMP": timestamp,
    "X-BYBIT-RECV-WINDOW": "5000",
    "Content-Type": "application/json"
  };
  
  await axios.post(url, params, { headers });
  
  const orderedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(orderedParams)
    .digest('hex');

  try {
    const response = await axios.post(url, params, {
      headers: {
        "X-BYBIT-SIGN": signature,
        "Content-Type": "application/json"
      }
    });

    console.log("📦 Ordem enviada com sucesso:", response.data);
  } catch (err) {
    console.error("❌ Erro ao enviar ordem:", err.response?.data || err.message);
  }
}

// 3. FUNÇÃO PRINCIPAL
async function main() {
  const closes = await fetchCandles();
  const rsi = RSI.calculate({ values: closes, period: 14 });
  const lastRsi = rsi[rsi.length - 1];

  console.log(`RSI atual: ${lastRsi}`);

  if (lastRsi < 20) {
    console.log('🔵 Sinal de COMPRA');
    await sendOrder({ side: "Buy", qty: "0.00001", symbol });
  } else if (lastRsi > 70) {
    console.log('🔴 Sinal de VENDA');
    await sendOrder({ side: "Sell", qty: "0.00001", symbol });
  } else {
    console.log('⚪ Sem sinal claro');
  }
}

main();

