import { BinanceRestClient } from "./binance-sdk";

async function main() {
  const symbol = process.env.BINANCE_SYMBOL ?? "BTCUSDT";
  const now = Date.now();

  const client = new BinanceRestClient({
    baseUrl: process.env.BINANCE_BASE_URL,
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  });

  const klines = await client.getKlines({
    symbol,
    interval: "1m",
    startTime: now - 60 * 60 * 1000,
    endTime: now,
  });

  console.log(`Fetched ${Array.isArray(klines) ? klines.length : 0} candles for ${symbol} (last 1h, 1m).`);
  console.log(klines);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Demo failed", err);
    process.exitCode = 1;
  });
}
