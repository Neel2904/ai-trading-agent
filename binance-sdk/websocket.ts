import {
  DEFAULT_COINM_TESTNET_WS_URL,
  DEFAULT_COINM_WS_URL,
  DEFAULT_USDM_TESTNET_WS_URL,
  DEFAULT_USDM_WS_URL,
} from "./constants";
import { WebSocketHandlers } from "./types";

type Market = "um" | "cm";

export interface WebSocketClientOptions {
  market?: Market;
  testnet?: boolean;
  baseUrl?: string;
}

export class BinanceWebSocketClient {
  private baseUrl: string;

  constructor(options: WebSocketClientOptions = {}) {
    const { market = "um", testnet = false, baseUrl } = options;

    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/$/, "");
      return;
    }

    const resolvedUrl = (() => {
      if (market === "cm") {
        return testnet ? DEFAULT_COINM_TESTNET_WS_URL : DEFAULT_COINM_WS_URL;
      }
      return testnet ? DEFAULT_USDM_TESTNET_WS_URL : DEFAULT_USDM_WS_URL;
    })();

    this.baseUrl = resolvedUrl.replace(/\/$/, "");
  }

  connect(streams: string | string[], handlers: WebSocketHandlers = {}): WebSocket {
    const streamNames = Array.isArray(streams) ? streams : [streams];

    if (streamNames.length === 0) {
      throw new Error("At least one stream name is required");
    }

    const path =
      streamNames.length === 1
        ? `/ws/${streamNames[0]}`
        : `/stream?streams=${streamNames.join("/")}`;

    const url = `${this.baseUrl}${path}`;
    const socket = new WebSocket(url);

    if (handlers.onOpen) {
      socket.addEventListener("open", () => handlers.onOpen?.(socket));
    }

    if (handlers.onMessage) {
      socket.addEventListener("message", handlers.onMessage);
    }

    if (handlers.onError) {
      socket.addEventListener("error", handlers.onError as EventListener);
    }

    if (handlers.onClose) {
      socket.addEventListener("close", handlers.onClose);
    }

    return socket;
  }

  subscribe(socket: WebSocket, streams: string | string[], id = Date.now()) {
    const streamList = Array.isArray(streams) ? streams : [streams];
    const payload = {
      method: "SUBSCRIBE",
      params: streamList,
      id,
    };
    socket.send(JSON.stringify(payload));
    return id;
  }

  unsubscribe(socket: WebSocket, streams: string | string[], id = Date.now()) {
    const streamList = Array.isArray(streams) ? streams : [streams];
    const payload = {
      method: "UNSUBSCRIBE",
      params: streamList,
      id,
    };
    socket.send(JSON.stringify(payload));
    return id;
  }
}
