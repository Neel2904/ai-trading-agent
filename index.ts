import { BinanceRestClient } from "./src/client";


const main = async () => {
  console.log("Binance REST Client module loaded.");
  const client = new BinanceRestClient({
    baseUrl: "https://testnet.binancefuture.com",
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  });

  const response = await client.getExchangeInfo();
  console.log({ response })
}

main()