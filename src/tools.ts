import type { ClosePositionParams, NewOrderRequest } from "../binance-sdk";
import type { OllamaTool, ToolCall } from "../llm/types";
import { binanceClient } from "./binanceConfig";

type PlaceOrderArgs = Pick<
  NewOrderRequest,
  "symbol" | "side" | "type" | "quantity" | "price" | "timeInForce" | "positionSide"
>;

const toolHandlers = {
  async placeOrder(args: PlaceOrderArgs) {
    const order: NewOrderRequest = {
      symbol: args.symbol,
      side: args.side,
      type: args.type ?? "MARKET",
      quantity: args.quantity,
      ...(args.positionSide ? { positionSide: args.positionSide } : {}),
      ...(args.price ? { price: args.price } : {}),
      ...(args.type === "LIMIT" ? { timeInForce: args.timeInForce ?? "GTC" } : {}),
    };

    if (order.type === "LIMIT" && order.price === undefined) {
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

export const tools: OllamaTool[] = [
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
        },
        required: ["symbol"],
      },
    },
  },
];
