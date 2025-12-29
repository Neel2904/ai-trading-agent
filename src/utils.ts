import type { RawCandlestick } from "../binance-sdk";

export function getOpenClose(candlestick: RawCandlestick) {
  if (Array.isArray(candlestick)) {
    const open = Number(candlestick[1]);
    const close = Number(candlestick[4]);

    return { open, close };
  }

  const open = Number(candlestick.open);
  const close = Number(candlestick.close);

  return { open, close };
}