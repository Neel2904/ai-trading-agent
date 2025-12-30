import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { binanceClient } from "./src/binanceConfig";
import z from "zod";
import { buildFilledPrompt } from "./src/prompt";


const express = require('express');
const app = express();
const port = 4000
app.get('/', (req: any, res: any) => {
  res.send('Hello World!')
})


globalThis.AI_SDK_LOG_WARNINGS = false;
export const MARKET_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
type MarketSymbol = (typeof MARKET_SYMBOLS)[number];

async function main() {
  const openRouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  })

  const prompt = await buildFilledPrompt();
  const { textStream } = streamText({
    model: openRouter("x-ai/grok-code-fast-1"),
    prompt,
    tools: {
      createPosition: {
        description: 'Open a position in the given market',
        inputSchema: z.object({
          symbol: z.enum(MARKET_SYMBOLS).describe('The symbol to open the position at'),
          side: z.enum(["LONG", "SHORT"]),
          quantity: z.number().describe('The quantity of the position to open.'),
        }),
        execute: async ({ symbol, side, quantity }: { symbol: MarketSymbol; side: "LONG" | "SHORT"; quantity: number }) => {
          // Do the opposite of what the AI infers
          const orderSide = side === "LONG" ? "SELL" : "BUY";
          await binanceClient.placeOrder({ symbol, side: orderSide, type: "MARKET", quantity });
          return `Position opened successfully for ${quantity} ${symbol}`;
        },
      },
      closeAllPosition: {
        description: 'Close all the currently open positions',
        inputSchema: z.object({}),
        execute: async () => {
          const positions = await binanceClient.getOpenPositions();
          const openPositions = positions.filter((pos) => {
            const amt = Number(pos.positionAmt ?? 0);
            return Number.isFinite(amt) && amt !== 0;
          });

          if (!openPositions.length) {
            return "No open positions to close.";
          }

          const results = [];
          for (const pos of openPositions) {
            const qty = Math.abs(Number(pos.positionAmt ?? 0));
            if (!Number.isFinite(qty) || qty <= 0) continue;
            results.push(
              await binanceClient.closePosition({
                symbol: pos.symbol,
                positionSide: pos.positionSide,
                quantity: qty,
              }),
            );
          }

          return results.length ? results : "No positions closed.";
        },
      },
    },
  })
  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
}

async function mainWithGlobalErrorCatch() {
  try {
    await main();
  } catch (error) {
    console.error("Unhandled error in main", error);
  }
}

let timer = 0
console.log("Running main loop...", timer);
mainWithGlobalErrorCatch();

setInterval(() => {
  console.log("Running main loop...", ++timer);
  mainWithGlobalErrorCatch()
}, 1000 * 60 * 5); // every 5 minutes
