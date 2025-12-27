export class BinanceError extends Error {
  status: number;
  code?: number;
  response?: unknown;

  constructor(message: string, status: number, code?: number, response?: unknown) {
    super(message);
    this.name = "BinanceError";
    this.status = status;
    this.code = code;
    this.response = response;
  }

  static async fromResponse(res: Response): Promise<BinanceError> {
    let payload: any;

    try {
      payload = await res.json();
    } catch {
      payload = await res.text();
    }

    const code = typeof payload?.code === "number" ? payload.code : undefined;
    const msg =
      typeof payload?.msg === "string"
        ? payload.msg
        : res.statusText || "Binance API error";

    const message = code !== undefined ? `[${code}] ${msg}` : msg;
    return new BinanceError(message, res.status, code, payload);
  }
}
