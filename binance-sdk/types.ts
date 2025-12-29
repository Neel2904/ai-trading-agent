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

export interface PositionRisk {
  symbol: string;
  positionAmt: string;
  positionSide?: PositionSide;
  entryPrice?: string;
  markPrice?: string;
  unRealizedProfit?: string;
  liquidationPrice?: string;
  leverage?: string;
  marginType?: string;
  isolatedMargin?: string;
  isolatedWallet?: string;
  notional?: string;
  updateTime?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface FuturesAccountAsset {
  asset: string;
  walletBalance: string;
  unrealizedProfit: string;
  marginBalance: string;
  maintMargin: string;
  initialMargin: string;
  positionInitialMargin: string;
  openOrderInitialMargin: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable?: boolean;
  updateTime: number;
}

export interface FuturesAccountPosition {
  symbol: string;
  initialMargin: string;
  maintMargin: string;
  unrealizedProfit: string;
  positionInitialMargin: string;
  openOrderInitialMargin: string;
  leverage: string;
  isolated: boolean;
  entryPrice: string;
  maxNotional: string;
  positionSide: PositionSide;
  positionAmt: string;
  updateTime: number;
  notional?: string;
  isolatedWallet?: string;
  bidNotional?: string;
  askNotional?: string;
  breakEvenPrice?: string;
}

export interface AccountInformation {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  updateTime: number;
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  totalCrossWalletBalance: string;
  totalCrossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets: FuturesAccountAsset[];
  positions: FuturesAccountPosition[];
  accountAlias?: string;
  totalAccountValue?: string;
  multiAssetsMargin?: boolean;
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

export interface Candlestick {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteAssetVolume: number;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
}
