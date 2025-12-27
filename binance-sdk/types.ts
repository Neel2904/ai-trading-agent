export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type OrderSide = "BUY" | "SELL" | string;
export type PositionSide = "BOTH" | "LONG" | "SHORT";
export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTX";
export type WorkingType = "MARK_PRICE" | "CONTRACT_PRICE";
export type NewOrderRespType = "ACK" | "RESULT" | "FULL";

export type FuturesOrderType =
  | "LIMIT"
  | "MARKET"
  | "STOP"
  | "STOP_MARKET"
  | "TAKE_PROFIT"
  | "TAKE_PROFIT_MARKET"
  | "TRAILING_STOP_MARKET"
  | "LIMIT_MAKER";

export interface BinanceClientOptions {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  recvWindow?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export interface RequestConfig {
  auth?: boolean;
  apiKeyOnly?: boolean;
  signal?: AbortSignal;
}

export type RequestParams = Record<string, string | number | boolean | undefined>;

export interface NewOrderRequest extends RequestParams {
  symbol: string;
  side: OrderSide;
  type: FuturesOrderType;
  positionSide?: PositionSide;
  timeInForce?: TimeInForce;
  quantity?: number | string;
  reduceOnly?: boolean;
  price?: number | string;
  newClientOrderId?: string;
  stopPrice?: number | string;
  closePosition?: boolean;
  activationPrice?: number | string;
  callbackRate?: number | string;
  workingType?: WorkingType;
  priceProtect?: boolean;
  newOrderRespType?: NewOrderRespType;
  recvWindow?: number;
}

export interface CancelOrderRequest extends RequestParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
  recvWindow?: number;
}

export interface QueryOrderRequest extends RequestParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
  recvWindow?: number;
}

export interface KlineParams extends RequestParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface BookDepthParams extends RequestParams {
  symbol: string;
  limit?: number;
}

export interface TradesParams extends RequestParams {
  symbol: string;
  limit?: number;
}

export interface FundingRateParams extends RequestParams {
  symbol?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface PositionRiskParams extends RequestParams {
  symbol?: string;
  pair?: string;
  recvWindow?: number;
}

export interface ClosePositionParams extends RequestParams {
  symbol: string;
  quantity?: number | string;
  positionSide?: PositionSide;
  recvWindow?: number;
}

export interface WebSocketHandlers {
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (data: MessageEvent<any>) => void;
  onError?: (err: Event | ErrorEvent) => void;
  onClose?: (ev: CloseEvent) => void;
}
