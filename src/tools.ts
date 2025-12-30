import type { ClosePositionParams, NewOrderRequest } from "../binance-sdk";
import type { OpenRouterTool, ToolCall } from "../llm/types";
import { binanceClient } from "./binanceConfig";

type PlaceOrderArgs = Pick<
  NewOrderRequest,
  "symbol" | "side" | "type" | "quantity" | "price" | "timeInForce" | "positionSide"
> & { reduceOnly?: boolean };

const toolHandlers = {
  async placeOrder(args: PlaceOrderArgs) {
    const symbol = (args.symbol ?? "").toString().trim().toUpperCase();
    if (!symbol) {
      throw new Error("symbol is required for placeOrder");
    }

    const side = (args.side ?? "").toString().toUpperCase();
    if (side !== "BUY" && side !== "SELL") {
      throw new Error("side must be BUY or SELL");
    }

    const quantity = Number(args.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("quantity must be a positive number");
    }

    const type = (args.type ?? "MARKET") as NewOrderRequest["type"];
    const reduceOnly = args.reduceOnly === true;

    const openPositions = await binanceClient.getOpenPositions();
    const hasOpenPosition =
      Array.isArray(openPositions) &&
      openPositions.some((pos) => Number(pos.positionAmt ?? 0) !== 0);

    if (hasOpenPosition && !reduceOnly) {
      throw new Error("An open position already exists. Close it before opening a new one to avoid stacking exposure.");
    }

    const order: NewOrderRequest = {
      symbol,
      side,
      type,
      quantity,
      ...(reduceOnly ? { reduceOnly: true } : {}),
      ...(args.positionSide ? { positionSide: args.positionSide } : {}),
      ...(args.price ? { price: args.price } : {}),
      ...(type === "LIMIT" ? { timeInForce: args.timeInForce ?? "GTC" } : {}),
    };

    if (type === "LIMIT" && order.price === undefined) {
      throw new Error("price is required for LIMIT orders");
    }

    return binanceClient.placeOrder(order);
  },
  async closePosition(args: ClosePositionParams) {
    const params: ClosePositionParams = {
      symbol: args.symbol,
      quantity: args.quantity,
      positionSide: args.positionSide,
    };
    return binanceClient.closePosition(params);
  },
};

function parseToolArguments<T>(call: ToolCall): T {
  const rawArgs = (call.function as any)?.arguments;

  if (rawArgs === undefined || rawArgs === null) {
    return {} as T;
  }

  if (typeof rawArgs === "object") {
    return rawArgs as T;
  }

  if (typeof rawArgs === "string") {
    try {
      return JSON.parse(rawArgs) as T;
    } catch (error) {
      throw new Error(`Failed to parse arguments for ${call.function.name}: ${(error as Error).message}`);
    }
  }

  try {
    return JSON.parse(String(rawArgs)) as T;
  } catch {
    throw new Error(`Unsupported argument shape for ${call.function.name}`);
  }
}

export async function executeToolCall(call: ToolCall) {
  const handler = (toolHandlers as Record<string, (args: any) => Promise<unknown>>)[call.function.name];
  if (!handler) {
    throw new Error(`Unsupported tool: ${call.function.name}`);
  }
  const args = parseToolArguments<any>(call);
  return handler(args);
}

export const tools: OpenRouterTool[] = [
  {
    type: "function",
    function: {
      name: "placeOrder",
      description: "Place a Binance futures order on USDT-margined contracts.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair, e.g. BTCUSDT" },
          side: { type: "string", enum: ["BUY", "SELL"], description: "Order side" },
          quantity: { type: "number", description: "Order size in base asset units" },
          type: {
            type: "string",
            enum: ["MARKET", "LIMIT"],
            description: "Order type (defaults to MARKET if omitted)",
          },
          price: { type: "number", description: "Limit price (required when type=LIMIT)" },
          positionSide: {
            type: "string",
            enum: ["BOTH", "LONG", "SHORT"],
            description: "Optional explicit side (useful when hedge mode is enabled)",
          },
          reduceOnly: {
            type: "boolean",
            description: "Set true to ensure the order only reduces an existing position",
          },
        },
        required: ["symbol", "side", "quantity", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "closePosition",
      description: "Close an existing open position with a reduce-only market order.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Trading pair to close, e.g. BTCUSDT" },
          quantity: {
            type: "number",
            description: "Quantity to close; omit to close the full detected position",
          },
          positionSide: {
            type: "string",
            enum: ["BOTH", "LONG", "SHORT"],
            description: "Optional explicit side (useful when hedge mode is enabled)",
          },
        },
        required: ["symbol"],
      },
    },
  },
];
