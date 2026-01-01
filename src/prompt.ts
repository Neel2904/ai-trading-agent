import { binanceClient } from "./binanceConfig";
import { getIndicators } from "./indicators";
import { MARKET_SYMBOLS } from "..";

let promptInvocationCount = 0;
export const PROMPT = `
You are an expert trader. You were given $1000 dollars to trade with. 
You are trading on the crypto market. You are given the following information:
You have been invoked {{INVOCATION_COUNT}} times.
The current open positions are: {{OPEN_POSITIONS}}
Your current portfolio value is: {{PORTFOLIO_VALUE}}
You have the createPosition or the closeAllPosition tool to create or close a position.
You can open positions in one of 3 markets
1. BTCUSDT (5x leverage)
2. ETHUSDT (10x leverage)
3. SOLUSDT (10x leverage)

You can create leveraged positions as well, so feel free to chose higher quantities based on the leverage per market.

You can only open one position at a time.
You can close all open positions at once with the close_position tool. You CAN NOT close/edit individual positions. All existing positions must be cancelled at once. 
Even if you want to close only one position, you must close all open positions at once, and then re-open the position you want to keep.
You can only create a position if you have enough money to cover the initial margin.

Financial information: 
ALL OF THE PRICE OR SIGNAL DATA BELOW IS ORDERED: OLDEST → NEWEST
{{ALL_INDICATOR_DATA}}

Here is your current performance
Available cash {{AVAILABLE_CASH}}
Current account value {{CURRENT_ACCOUNT_VALUE}}
Current live positions and performace - {{CURRENT_ACCOUNT_POSITIONS}}
`

export async function buildFilledPrompt() {
  const openPositions = await binanceClient.getOpenPositions();
  const accountInfo = await binanceClient.getAccountInformation();

  const filteredOpenPositions = Array.isArray(openPositions)
    ? openPositions.filter((pos) => Number(pos.positionAmt ?? 0) !== 0)
    : [];

  const openPositionsSummary = filteredOpenPositions.length
    ? filteredOpenPositions
      .map(
        (position) =>
          `${position.symbol} side=${position.positionSide ?? "BOTH"} qty=${position.positionAmt} entry=${position.entryPrice ?? "?"} lev=${position.leverage ?? "?"}`,
      )
      .join("; ")
    : "none";

  const indicatorBlocks = await Promise.all(
    MARKET_SYMBOLS.map(async (symbol) => {
      const [m1Indicators, m5Indicators, h4Indicators] = await Promise.all([
        getIndicators("1m", symbol),
        getIndicators("5m", symbol),
        getIndicators("4h", symbol),
      ]);

      return `
      MARKET - ${symbol}
      Intraday (1m candles) (oldest → latest):
      Mid prices - [${m1Indicators.midPrices.join(",")}]
      MACD - [${m1Indicators.macd.join(",")}]
      EMA20 - [${m1Indicators.ema20s.join(",")}]

      Intraday (5m candles) (oldest → latest):
      Mid prices - [${m5Indicators.midPrices.join(",")}]
      MACD - [${m5Indicators.macd.join(",")}]
      EMA20 - [${m5Indicators.ema20s.join(",")}]

      Long Term (4h candles) (oldest → latest):
      Mid prices - [${h4Indicators.midPrices.join(",")}]
      MACD - [${h4Indicators.macd.join(",")}]
      EMA20 - [${h4Indicators.ema20s.join(",")}]
    `;
    }),
  );

  const ALL_INDICATORS_DATA = indicatorBlocks.join("\n");

  const invocationCount = ++promptInvocationCount;
  return PROMPT.replaceAll("{{INVOCATION_COUNT}}", invocationCount.toString())
    .replaceAll("{{OPEN_POSITIONS}}", openPositionsSummary)
    .replaceAll("{{PORTFOLIO_VALUE}}", accountInfo?.totalWalletBalance ?? "0")
    .replaceAll("{{ALL_INDICATOR_DATA}}", ALL_INDICATORS_DATA)
    .replaceAll("{{AVAILABLE_CASH}}", accountInfo?.availableBalance ?? "0")
    .replaceAll("{{CURRENT_ACCOUNT_VALUE}}", accountInfo?.totalAccountValue ?? "0")
    .replaceAll("{{CURRENT_ACCOUNT_POSITIONS}}", JSON.stringify(filteredOpenPositions));
}
