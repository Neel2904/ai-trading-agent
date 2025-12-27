import { BinanceRestClient } from "../binance-sdk";

const client = new BinanceRestClient({
  baseUrl: "https://testnet.binancefuture.com",
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

// const response = await client.placeOrder({
//   symbol: "BTCUSDT",
//   side: "BUY",
//   type: "MARKET",
//   quantity: 0.5,
// });
// const response = await client.closePosition({ symbol: "BTCUSDT" });
// console.log({ response });

export { client as binanceClient };