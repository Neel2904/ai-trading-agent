import { BinanceRestClient } from "../binance-sdk";

export const binanceClient = new BinanceRestClient({
  baseUrl: "https://fapi.binance.com",
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});