# Guidance for Binance SDK work

## Current scope
- Added a lightweight TypeScript SDK wrapper for Binance Futures (UM by default) with REST and WebSocket helpers.
- SDK lives in `binance-sdk/` (standalone folder) and is re-exported via `index.ts` for direct imports from the package root.

## Setup and usage
- Configure credentials via env vars `BINANCE_API_KEY` and `BINANCE_API_SECRET`. Pass `apiKey`/`apiSecret` to `BinanceRestClient` only via runtime config, not code or repo files.
- Default base URL targets mainnet USDT-M (`https://fapi.binance.com`). Override with `baseUrl` for testnet (e.g., `https://testnet.binancefuture.com`) or Coin-M endpoints if needed.
- Key entry points:
  - `BinanceRestClient` for REST (public + signed) including orders, account, market data, and user data streams.
  - `BinanceWebSocketClient` for market/user stream connections, with subscribe/unsubscribe helpers for combined streams.
- Timeout and recv window: adjust via `timeoutMs` and `recvWindow` when constructing the client.
- Example (public request):
  ```ts
  const client = new BinanceRestClient();
  const markPrices = await client.getMarkPrice({ symbol: "BTCUSDT" });
  ```
- Example (signed order on testnet):
  ```ts
  const client = new BinanceRestClient({
    baseUrl: "https://testnet.binancefuture.com",
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  });

  await client.placeOrder({
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    quantity: 0.001,
  });
  ```

## Security precautions
- Never log secrets or the full signed query string; keep `apiSecret` out of error paths.
- Use principle of least privilege on API keys and prefer testnet for validation.
- Keep `.env` values untracked; avoid writing credentials to disk in scripts or docs.
- Signed requests use `recvWindow` + timestamp and support `timeoutMs` to avoid hung calls.
- When opening WebSocket streams, close idle sockets and avoid sharing listenKeys outside your environment.

## Work log
- Initialized SDK scaffold, added REST client with signing, WebSocket helper, and documentation/README updates (this task). Update this file with future changes or new setup steps.
- Reorganized SDK into `binance-sdk/` folder and updated imports/docs to match (current task).
- Added DOM typings via `tsconfig.json` (`lib: ["ESNext","DOM","DOM.Iterable"]`, `types: ["bun-types"]`) to resolve fetch/WebSocket/AbortController typing issues.
- Added `closePosition` convenience method that fetches current position size (via `getPositionRisk`) when quantity is omitted and submits a reduce-only market order to flatten exposure.
- Migrated LLM client to OpenRouter chat completions with tool-calling support (`llm/`), defaulting to `OPENROUTER_MODEL` (default `openrouter/auto`) and optional referer/title headers for routing.
- Added `getOpenPositions` helper to surface only non-zero USDM positions (wraps `/fapi/v2/positionRisk`).
