# ai-trading-agent SDK

Binance Futures (UM by default) trading SDK built with TypeScript/Bun. It wraps key REST endpoints with signed request support and provides a small WebSocket helper for market and user data streams.

## Features
- Public endpoints: ping/time, exchange info, order book, recent/agg trades, klines, mark price, funding rates, tickers.
- Private endpoints: account/balance/positions, income history, query/cancel/open orders, place/test orders (with recvWindow + timestamp signing).
- User data stream helpers: create/keepalive/close listen keys.
- WebSocket helper: connect to single or combined streams, subscribe/unsubscribe helpers.

## Setup
1. Install deps (already vendored via Bun): `bun install`.
2. Export credentials securely (or pass at runtime):
   - `BINANCE_API_KEY=...`
   - `BINANCE_API_SECRET=...`
3. Use testnet unless you intentionally want mainnet trading.
4. SDK source now lives in `binance-sdk/`; import from there or continue importing from the package root re-export.

## Usage
```ts
// Import directly from the SDK folder within this project
import { BinanceRestClient, BinanceWebSocketClient } from "./binance-sdk";

// or, if consumed as a package entry point:
// import { BinanceRestClient, BinanceWebSocketClient } from "ai-trading-agent";

// REST client (testnet example)
const client = new BinanceRestClient({
  baseUrl: "https://testnet.binancefuture.com",
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

await client.ping();
const account = await client.getAccountInformation();

await client.placeOrder({
  symbol: "BTCUSDT",
  side: "BUY",
  type: "MARKET",
  quantity: 0.001,
});

// Get currently open positions (non-zero size only)
const openPositions = await client.getOpenPositions();

// WebSocket (combined stream)
const wsClient = new BinanceWebSocketClient({ testnet: true });
const socket = wsClient.connect(["btcusdt@bookTicker", "ethusdt@aggTrade"], {
  onMessage: (event) => console.log(event.data),
});

// Close an open position (reduce-only market). Quantity omitted -> auto-detects current size.
await client.closePosition({ symbol: "BTCUSDT" });
```

## LLM (OpenRouter) setup
- Configure `OPENROUTER_API_KEY` in `.env`. Optionally set `OPENROUTER_BASE_URL` (defaults to `https://openrouter.ai/api/v1`), `OPENROUTER_MODEL` (defaults to `openrouter/auto`), `OPENROUTER_SITE_URL` for the `HTTP-Referer` header, and `OPENROUTER_APP_TITLE` for `X-Title`.
- Default client lives in `llm/index.ts` and uses the model from `OPENROUTER_MODEL`. The client follows the OpenAI-compatible Chat Completions API, including tool calling support.
- Basic chat example:
  ```ts
  import { openrouter } from "./llm";

  const chat = await openrouter.chat({
    messages: [
      { role: "system", content: "You are a trading research assistant." },
      { role: "user", content: "Summarize BTCUSDT market drivers today." },
    ],
  });

  console.log("Full reply:", chat.message?.content);
  ```
- List available models with `openrouter.listModels()`; choose a model supported by your OpenRouter account (e.g., `openrouter/auto` or a specific provider/model identifier).

## Notes
- Secrets are never logged; avoid committing `.env` or credentials.
- Signed calls require synced clock; adjust `recvWindow`/`timeoutMs` if you see timestamp errors.
- Network calls are not exercised in CI here; validate against Binance testnet before mainnet usage.
