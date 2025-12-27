import { BinanceRestClient } from "./binance-sdk";

async function main() {
  console.log({ key: process.env.BINANCE_API_KEY });

  const client = new BinanceRestClient({
    baseUrl: "https://testnet.binancefuture.com",
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  });

  const response = await client.getAccountInformation();
  console.log({ response });
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Demo failed", err);
    process.exitCode = 1;
  });
}
