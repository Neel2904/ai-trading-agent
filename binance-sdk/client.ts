import {
  DEFAULT_RECV_WINDOW,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USDM_BASE_URL,
} from "./constants";
import { BinanceError } from "./errors";
import {
  type BinanceClientOptions,
  type AccountInformation,
  type BookDepthParams,
  type CancelOrderRequest,
  type FundingRateParams,
  type KlineParams,
  type ClosePositionParams,
  type PositionSide,
  type NewOrderRequest,
  type PositionRisk,
  type PositionRiskParams,
  type QueryOrderRequest,
  type RequestConfig,
  type RequestParams,
  type TradesParams,
  type Candlestick,
} from "./types";
import { buildQuery, isJsonResponse, signPayload, withTimestamp } from "./utils";

export class BinanceRestClient {
  private apiKey?: string;
  private apiSecret?: string;
  private baseUrl: string;
  private recvWindow: number;
  private timeoutMs: number;
  private userAgent?: string;

  constructor({
    apiKey,
    apiSecret,
    baseUrl = DEFAULT_USDM_BASE_URL,
    recvWindow = DEFAULT_RECV_WINDOW,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    userAgent,
  }: BinanceClientOptions = {}) {
    this.apiKey = apiKey ?? process.env.BINANCE_API_KEY;
    this.apiSecret = apiSecret ?? process.env.BINANCE_API_SECRET;
    this.baseUrl = baseUrl;
    this.recvWindow = recvWindow;
    this.timeoutMs = timeoutMs;
    this.userAgent = userAgent;
  }

  /**
   * Public endpoints
   */
  ping() {
    return this.request("GET", "/fapi/v1/ping");
  }

  getServerTime() {
    return this.request<{ serverTime: number }>("GET", "/fapi/v1/time");
  }

  getExchangeInfo(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/exchangeInfo", params);
  }

  getOrderBook(params: BookDepthParams) {
    return this.request("GET", "/fapi/v1/depth", params);
  }

  getRecentTrades(params: TradesParams) {
    return this.request("GET", "/fapi/v1/trades", params);
  }

  getAggTrades(params: TradesParams & { fromId?: number; startTime?: number; endTime?: number }) {
    return this.request("GET", "/fapi/v1/aggTrades", params);
  }

  getKlines(params: KlineParams): Promise<Candlestick[]> {
    return this.request("GET", "/fapi/v1/klines", params);
  }

  getFundingRate(params: FundingRateParams = {}) {
    return this.request("GET", "/fapi/v1/fundingRate", params);
  }

  getMarkPrice(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/premiumIndex", params);
  }

  get24hTicker(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/ticker/24hr", params);
  }

  getTickerPrice(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/ticker/price", params);
  }

  getBookTicker(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/ticker/bookTicker", params);
  }

  getOpenInterest(params: { symbol: string }) {
    return this.request("GET", "/fapi/v1/openInterest", params);
  }

  /**
   * Private endpoints (signature)
   */
  getAccountInformation(params: RequestParams = {}) {
    return this.request<AccountInformation>("GET", "/fapi/v2/account", params, { auth: true });
  }

  getBalances(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v2/balance", params, { auth: true });
  }

  getPositionRisk(params: PositionRiskParams = {}) {
    return this.request<PositionRisk[]>("GET", "/fapi/v2/positionRisk", params, { auth: true });
  }

  /**
   * Fetch all open positions (filters out zero-sized positions).
   */
  async getOpenPositions(params: PositionRiskParams = {}): Promise<PositionRisk[]> {
    const positions = await this.getPositionRisk(params);
    const list = Array.isArray(positions) ? positions : [positions];
    return list.filter((pos) => {
      const amt = Number((pos as any)?.positionAmt ?? 0);
      return Number.isFinite(amt) && amt !== 0;
    });
  }

  getIncomeHistory(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/income", params, { auth: true });
  }

  getOpenOrders(params: RequestParams = {}) {
    return this.request("GET", "/fapi/v1/openOrders", params, { auth: true });
  }

  getAllOrders(params: RequestParams & { symbol: string }) {
    return this.request("GET", "/fapi/v1/allOrders", params, { auth: true });
  }

  queryOrder(params: QueryOrderRequest) {
    return this.request("GET", "/fapi/v1/order", params, { auth: true });
  }

  placeOrder(params: NewOrderRequest) {
    console.log("Placing order with:", { params });
    if (params.type === "LIMIT" && !params.timeInForce) {
      throw new Error("timeInForce is required for LIMIT orders");
    }

    return this.request("POST", "/fapi/v1/order", params, { auth: true });
  }

  placeTestOrder(params: NewOrderRequest) {
    return this.request("POST", "/fapi/v1/order/test", params, { auth: true });
  }

  cancelOrder(params: CancelOrderRequest) {
    return this.request("DELETE", "/fapi/v1/order", params, { auth: true });
  }

  cancelAllOpenOrders(params: { symbol: string; recvWindow?: number }) {
    return this.request("DELETE", "/fapi/v1/allOpenOrders", params, { auth: true });
  }

  /**
   * Convenience: close an existing position with a reduce-only market order.
   * If quantity is omitted, it fetches current position size via getPositionRisk.
   */
  async closePosition({
    symbol,
    quantity,
    positionSide,
    recvWindow,
  }: ClosePositionParams): Promise<unknown> {
    const normalizedSymbol = symbol.toUpperCase();
    const positions = await this.getOpenPositions({ symbol: normalizedSymbol, recvWindow });
    const positionArray = Array.isArray(positions) ? positions : [positions];

    const matchBySymbol = (p: any) =>
      p &&
      typeof p === "object" &&
      ((p as any).symbol === normalizedSymbol || (p as any).symbol === symbol);
    const matchBySide = (p: any) => !positionSide || (p as any)?.positionSide === positionSide;

    const openPositions = positionArray.filter((p: any) => {
      if (!matchBySymbol(p) || !matchBySide(p)) return false;
      const amt = Number((p as any)?.positionAmt ?? 0);
      return Number.isFinite(amt) && amt !== 0;
    });
    if (!openPositions.length) {
      return { status: "noop", reason: `No open position found for ${normalizedSymbol}` };
    }

    let remainingQty = quantity === undefined ? undefined : Math.abs(Number(quantity));
    if (remainingQty !== undefined && (!Number.isFinite(remainingQty) || remainingQty <= 0)) {
      return { status: "noop", reason: `Invalid close quantity for ${normalizedSymbol}` };
    }

    const results: unknown[] = [];

    // Flatten any matching positions (handles LONG/SHORT entries when hedge mode is enabled).
    for (const pos of openPositions) {
      const posAmt = Number((pos as any)?.positionAmt ?? 0);
      const absPosSize = Math.abs(posAmt);
      if (!absPosSize) continue;

      const closeQty = remainingQty === undefined ? absPosSize : Math.min(absPosSize, remainingQty);
      if (!Number.isFinite(closeQty) || closeQty <= 0) continue;

      const effectivePositionSide: PositionSide =
        positionSide ??
        (typeof (pos as any)?.positionSide === "string"
          ? ((pos as any)?.positionSide as PositionSide)
          : "BOTH");

      const side =
        effectivePositionSide === "SHORT"
          ? "BUY"
          : effectivePositionSide === "LONG"
            ? "SELL"
            : posAmt > 0
              ? "SELL"
              : "BUY";

      const orderPayload: NewOrderRequest = {
        symbol: normalizedSymbol,
        side,
        type: "MARKET",
        quantity: closeQty,
        reduceOnly: true,
        ...(effectivePositionSide && effectivePositionSide !== "BOTH"
          ? { positionSide: effectivePositionSide }
          : {}),
        ...(recvWindow ? { recvWindow } : {}),
      };

      results.push(await this.placeOrder(orderPayload));

      if (remainingQty !== undefined) {
        remainingQty = Math.max(0, remainingQty - closeQty);
        if (remainingQty <= 1e-12) break;
      }
    }

    if (!results.length) {
      return { status: "noop", reason: `Close quantity exhausted for ${normalizedSymbol}` };
    }

    return results.length === 1 ? results[0] : { status: "ok", orders: results };
  }

  /**
   * User data streams
   */
  createUserDataStream() {
    return this.request<{ listenKey: string }>("POST", "/fapi/v1/listenKey", {}, { apiKeyOnly: true });
  }

  keepAliveUserDataStream(listenKey: string) {
    return this.request("PUT", "/fapi/v1/listenKey", { listenKey }, { apiKeyOnly: true });
  }

  closeUserDataStream(listenKey: string) {
    return this.request("DELETE", "/fapi/v1/listenKey", { listenKey }, { apiKeyOnly: true });
  }

  /**
   * Internal request helper
   */
  private async request<T = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    params: RequestParams = {},
    { auth = false, apiKeyOnly = false, signal }: RequestConfig = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const headers = new Headers();
    const paramRecvWindow =
      (params as RequestParams & { recvWindow?: number }).recvWindow ?? this.recvWindow;
    const shouldSign = auth && !apiKeyOnly;

    if (this.userAgent) {
      headers.set("User-Agent", this.userAgent);
    }

    if (auth || apiKeyOnly) {
      if (!this.apiKey) {
        throw new Error("BINANCE_API_KEY is required for authenticated requests");
      }
      headers.set("X-MBX-APIKEY", this.apiKey);
    }

    const baseParams = shouldSign
      ? withTimestamp(params, paramRecvWindow)
      : params;
    const search = buildQuery(baseParams);

    if (shouldSign) {
      if (!this.apiSecret) {
        throw new Error("BINANCE_API_SECRET is required for signed requests");
      }

      const signature = signPayload(search.toString(), this.apiSecret);
      search.append("signature", signature);
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }

    let body: string | undefined;
    if (method === "GET" || method === "DELETE") {
      const query = search.toString();
      if (query) {
        url.search = query;
      }
    } else {
      body = search.toString();
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }

    const controller = signal ? undefined : new AbortController();
    const timeout =
      controller && this.timeoutMs > 0
        ? setTimeout(() => controller.abort(), this.timeoutMs)
        : undefined;
    const requestSignal = signal ?? controller?.signal;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: requestSignal,
      });

      if (!response.ok) {
        throw await BinanceError.fromResponse(response);
      }

      if (isJsonResponse(response.headers)) {
        return (await response.json()) as T;
      }

      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        if (!controller) {
          throw new Error("Request aborted by caller");
        }
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }

      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
